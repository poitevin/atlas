import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import "./App.css";
import airportData from "./airportData.json";
import linesData from "./linesData.json";

// ---------------------------------------------
// Emission assumptions (standardized, single source of truth)
// ---------------------------------------------
const EF_MILE = 0.217;                // kg CO2 per mile per passenger
const EF_KM = EF_MILE / 1.609344;     // kg CO2 per km per passenger
const PASSENGERS = 100;               // average passengers per flight
const RF = 2.3;                       // radiative forcing multiplier
const TARGET_TOTAL_KM = 2772157;      // Spanish itinerary target (2,772,157 km)
const fmt = new Intl.NumberFormat("es-MX");

// ---------------------------------------------
// Airport codes for "Atlas oculto de la inmensa ruina"
// (Shown when toggling from poem to codes view.)
// ---------------------------------------------
const airportCodes = `ATL-ASO-CUL-TOD-ELA-INM-ENS-ARU-INA

ELA-LBA-INU-NDA-ELC-AUC-EDE-LSI-LEN-CIO
MIE-NTR-ASD-ESD-ELA-SCO-PAS-MUS-ITA-NLA-SAL-OND-RAS
DES-PIE-RTA-STI-TUB-EAN-TES-ELM-ILA-GRO-DEL-DIA
ENS-USA-LAS-AGU-DAS-UNA-ALE-GRI-ATE-NUE
COM-OUN-MUR-MUL-LOE-NNU-BES

SAL-EUN-HOM-BRE-ENH-ARA-POS-TOD-AVI-ASO-MNO-LIE-NTO
ARE-GAR-FLO-RES-YTR-APE-ARE-LPA-TIO
SUM-IRA-DAA-TRA-IDA-COM-OLO-EST-ALA-MIA
POR-COS-ASM-ARG-INA-LES-RAI-CES-TAL-LOS-YHO-JAS
YSU-MEM-ORI-ADE-LIN-EAN-DOE-LBO-RDE
DEL-MUN-DOE-NEL-POE-MAQ-UEE-LBO-SQU-EJA

POC-ASH-ORA-SMA-STA-RDE-ENE-LBU-LLI-CIO
DEL-TRA-NSI-TOQ-UEN-OSE-NER-VAA-TAN-TOS
LOS-MER-CAD-OSS-ELL-ENA-NLA-MAS-AAT-OLO-NDR-ADA
DES-LIZ-AND-OSE-ENF-ILA-POR-BRI-LLA-NTE-SPA-SIL-LOS
DON-DEM-ANO-SSO-PES-ANM-ARA-VIL-LAS
TRA-IDA-SDE-SDE-FRA-NCI-AIR-ANO-GUA-TEM-ALA

YCU-AND-OAM-AIN-AEL-TRA-NSI-TOE-NLA-HOR-AMA-SIN-CIE-RTA
SUB-ITA-MEN-TEE-LAL-MAA-SCI-END-EEN-TRE-LOS-CIR-ROS
DES-DED-OND-EIN-SPE-CCI-ONA-LOS-SIM-BOL-OSO-CUL-TOS
DEL-SIS-TEM-ARE-INA-NTE-DEL-CUA-LSO-MOS
ALF-AYO-MEG-AYT-ODO-CUA-NTO-AJU-STA
LOS-LIM-ITE-SDE-LCI-ELO

ELO-JOE-NTO-NCE-SMI-RAH-URA-CAN-ADO
RET-AZO-SDE-CUL-TIV-OSZ-URC-IDO-SCO-MOU-NMA-NTO
CIU-DAD-ESG-RIS-ESC-ORD-ILL-ERA-SAL-TAS
BES-OSD-ESO-LNE-VAD-OPO-RLO-SPI-COS
YPA-RPA-DEA-ENS-USI-TIO-SIN-BOS-TEZ-ONO-CTU-RNO
SOB-REL-ACE-LES-TIA-LES-PAD-ADE-LOC-ASO`;

// ---------------------------------------------
// Poem text
// ---------------------------------------------
const poem = `Atlas oculto de la inmensa ruina

El alba inunda el cauce del silencio
mientras, desde las copas, musitan las alondras
despiertas, titubeantes, el milagro del día,
en sus alas agudas una alegría tenue
como un murmullo en nubes.

Sale un hombre en harapos, todavía somnoliento,
a regar flores y trapear el patio,
su mirada atraída, como lo está la mía,
por cosas marginales –raíces, tallos y hojas–
y su memoria delineando el borde
del mundo en el poema que él bosqueja.

Pocas horas más tarde, en el bullicio
del tránsito que nos enerva a tantos,
los mercados se llenan, la masa atolondrada
deslizándose en fila por brillantes pasillos
donde manos sopesan maravillas
traídas desde Francia, Irán o Guatemala.

Y cuando amaina el tránsito, en la hora más incierta,
súbitamente el alma asciende entre los cirros,
desde donde inspecciona los símbolos ocultos
del sistema reinante del cual somos
alfa y omega y todo cuanto ajusta
los límites del cielo.

El ojo entonces mira, huracanado,
retazos de cultivos, zurcidos cual un manto,
ciudades grises, cordilleras altas,
besos de sol nevado por los picos,
y parpadea en su sitio, sin bostezo nocturno,
sobre la celestial espada del ocaso.`;

// ---------------------------------------------
// Helpers
// ---------------------------------------------
function toRad(d) { return (d * Math.PI) / 180; }
function haversineKm(a, b) {
  const dLat = toRad((b.lat ?? b.latitude) - (a.lat ?? a.latitude));
  const dLon = toRad((b.lon ?? b.longitude) - (a.lon ?? a.longitude));
  const la1 = toRad(a.lat ?? a.latitude), la2 = toRad(b.lat ?? b.latitude);
  const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2 * 6371 * Math.asin(Math.sqrt(h)); // km
}

function splitCodes(itineraryStr) {
  return itineraryStr.split("-").map(s => s.trim().toUpperCase()).filter(Boolean);
}

// ---------------------------------------------
// Main
// ---------------------------------------------
const App = () => {
  const [bubbleStyle, setBubbleStyle] = useState({ top: "-1000px", left: "-1000px" });
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [displayPoem, setDisplayPoem] = useState(true);
  const [selectedLineData, setSelectedLineData] = useState(null);
  const [selectedCode, setSelectedCode] = useState(null);
  const [highlightedLine, setHighlightedLine] = useState(null);
  const displayRef = useRef();
  const bubbleRef = useRef();

  // Index airports once for O(1) lookup
  const airportsByCode = useMemo(() => {
    return new Map(airportData.map(a => [String(a.code).toUpperCase(), a]));
  }, []);

  // Compute line distance from itinerary string using airportData coordinates
  const computeLineDistanceKm = (itineraryStr) => {
    const codes = splitCodes(itineraryStr);
    let km = 0;
    for (let i = 0; i < codes.length - 1; i++) {
      const A = airportsByCode.get(codes[i]);
      const B = airportsByCode.get(codes[i + 1]);
      if (!A || !B) {
        console.warn("Missing airport in airportData:", !A ? codes[i] : codes[i + 1]);
        continue;
        }
      km += haversineKm(A, B);
    }
    return km;
  };

  const emissionsKgCO2e = (km) => km * EF_KM * PASSENGERS * RF;

  // Totals for summary header
  const { totalKm, totalKgCO2e, airportCount, missingCodes } = useMemo(() => {
    let kmTotal = 0;
    const codeSet = new Set();
    const missing = new Set();

    linesData.forEach((l) => {
      const codes = splitCodes(l.itinerary || "");
      codes.forEach(c => {
        codeSet.add(c);
        if (!airportsByCode.get(c)) missing.add(c);
      });
      kmTotal += computeLineDistanceKm(l.itinerary || "");
    });

    return {
      totalKm: kmTotal,
      totalKgCO2e: emissionsKgCO2e(kmTotal),
      airportCount: codeSet.size,
      missingCodes: Array.from(missing),
    };
  }, [airportsByCode]);

  // Positioning bubble near target rect
  const setBubblePosition = (rect, type) => {
    if (!displayRef.current || !bubbleRef.current) return;
    const contentRect = displayRef.current.getBoundingClientRect();
    const infoBubbleRect = bubbleRef.current.getBoundingClientRect();

    const AL = rect.left - contentRect.left;
    const AR = contentRect.right - rect.right;
    const AT = rect.top - contentRect.top;
    const AB = contentRect.bottom - rect.bottom;

    const maxHorizontalSpace = Math.max(AL, AR);
    const maxVerticalSpace = Math.max(AT, AB);

    const next = { display: "block", top: 0, left: 0 };

    if (type === "line") {
      next.left = rect.left - contentRect.left + (rect.width - infoBubbleRect.width) / 2;
    } else {
      if (maxHorizontalSpace === AL) {
        next.left = rect.left - contentRect.left - infoBubbleRect.width;
      } else {
        next.left = rect.right - contentRect.left;
      }
    }

    if (maxVerticalSpace === AT) {
      next.top = rect.top - contentRect.top - infoBubbleRect.height;
    } else {
      next.top = rect.bottom - contentRect.top;
    }

    // Clamp to container
    next.left = Math.max(8, Math.min(next.left, contentRect.width - infoBubbleRect.width - 8));
    next.top  = Math.max(8, Math.min(next.top,  contentRect.height - infoBubbleRect.height - 8));

    setBubbleStyle(next);
  };

  // Selectors & effects
  useEffect(() => {
    if (selectedAirport && selectedCode && bubbleRef.current && displayRef.current) {
      const codeTarget = document.querySelector(`.code.selected-code`);
      if (codeTarget) {
        const rect = codeTarget.getBoundingClientRect();
        setBubblePosition(rect, "code");
      }
    }
  }, [selectedAirport, selectedCode]);

  useLayoutEffect(() => {
    if (selectedLineData && bubbleRef.current && displayRef.current) {
      const lineElement = document.querySelector(`.poem-line.highlighted-line`);
      if (lineElement) {
        const rect = lineElement.getBoundingClientRect();
        setBubblePosition(rect, "line");
      }
    }
  }, [selectedLineData]);

  const handleLineClick = (event, globalLineIndex) => {
    event.stopPropagation();
    if (linesData[globalLineIndex]) {
      setSelectedLineData(linesData[globalLineIndex]);
      setHighlightedLine(globalLineIndex);
      const rect = event.target.getBoundingClientRect();
      setBubblePosition(rect, "line");
    }
  };

  const handleClick = (event) => {
    if (event.target.classList.contains("poem-text")) {
      const lineElement = event.target.closest(".poem-line");
      if (lineElement) {
        handleLineClick(event, parseInt(lineElement.dataset.index, 10));
        return;
      }
    }

    const codeTarget = event.target.closest(".code");
    if (codeTarget) {
      const tappedCode = codeTarget.textContent.trim().toUpperCase();
      const airport = airportsByCode.get(tappedCode);
      setSelectedAirport(airport || null);
      setSelectedCode(tappedCode);
      setHighlightedLine(null);
      if (bubbleRef.current && displayRef.current) {
        const rect = codeTarget.getBoundingClientRect();
        setBubblePosition(rect, "code");
      }
      return;
    }

    if (!event.target.closest(".info-bubble")) {
      if (!selectedAirport && !selectedLineData) {
        setDisplayPoem(!displayPoem);
      } else {
        setSelectedAirport(null);
        setSelectedLineData(null);
        setSelectedCode(null);
        setHighlightedLine(null);
        setBubbleStyle({ top: "-1000px", left: "-1000px" });
      }
    }
  };

  // Render
  let globalLineIndex = 0;

  return (
    <div className="App" ref={displayRef} onClick={handleClick}>
      <div className="content-container">
        {/* Header info */}
        <div className="author-container">
          <span className="author-text">Poema de: Pedro Poitevin</span>
        </div>
        <div className="photographer-container">
          <span className="photographer-text">Foto de: Arturo Godoy</span>
        </div>

        <div
          className={`content-window${
            selectedAirport ? " selected-airport"
            : selectedLineData ? " selected-line-data"
            : ""
          }`}
        >
          <div className="content-window">
            <div className="responsive-container">
              <div className="monospace">
                {displayPoem
                  ? poem.split("\n\n").map((stanza, stanzaIndex) => (
                      <div key={stanzaIndex} className="stanza">
                        {stanza.split("\n").map((line) => {
                          const currentLineIndex = globalLineIndex++;
                          return (
                            <div
                              key={currentLineIndex}
                              data-index={currentLineIndex}
                              className={`poem-line ${
                                highlightedLine === currentLineIndex ? "highlighted-line" : ""
                              }`}
                            >
                              <div className="poem-text-container">
                                <span className="poem-text">{line}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))
                  : airportCodes.split("\n\n").map((stanza, stanzaIndex) => (
                      <div key={stanzaIndex} className="stanza">
                        {stanza.split("\n").map((line, lineIndex) => (
                          <div
                            key={`${stanzaIndex}-${lineIndex}`}
                            className={lineIndex === 0 ? "airport-codes-title" : ""}
                          >
                            {line.split("-").map((code, idx) => (
                              <React.Fragment key={idx}>
                                <span
                                  className={`code${selectedCode === code ? " selected-code" : ""}`}
                                >
                                  {code}
                                </span>
                                {idx !== line.split("-").length - 1 && "-"}
                              </React.Fragment>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
              </div>
            </div>

            {/* Info bubble */}
            <div
              ref={bubbleRef}
              className={`info-bubble${selectedAirport || selectedLineData ? " show-info" : ""}`}
              style={{
                ...bubbleStyle,
                backgroundImage: selectedAirport ? `url(${getSecureMapUrl(selectedAirport)})` : "none",
                backgroundSize: selectedAirport ? "cover" : "none",
              }}
            >
              {selectedAirport && (
                <div className="airport-info-window info-window">
                  <div className="info">
                    <div className="airport-name">
                      <strong>{selectedAirport.name}</strong>
                    </div>
                    <div className="country">
                      <strong>{selectedAirport.country}</strong>
                    </div>
                  </div>
                </div>
              )}

              {selectedLineData && (
                <div className="line-data-window info-window line-data-window-custom">
                  <div className="line-data">
                    <div className="itinerary">{selectedLineData.itinerary}</div>
                    <div style={{ margin: "10px 0" }} />
                    {/* Live distance/emissions based on our constants */}
                    {(() => {
                      const km = computeLineDistanceKm(selectedLineData.itinerary || "");
                      const kg = emissionsKgCO2e(km);
                      return (
                        <>
                          <div className="length">
                            Esta línea tiene {fmt.format(Math.round(km))} kilómetros de longitud
                          </div>
                          <div style={{ margin: "10px 0" }} />
                          <div className="carbon-footprint">
                            Esta línea emite aproximadamente {fmt.format(Math.round(kg))} kilogramos de CO
                            <sub>2</sub>e
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="cta-container">
          <button className="cta-button">Explora</button>
        </div>
      </div>
    </div>
  );
};

// Use Netlify function or another server-side map proxy for static map tiles
const getSecureMapUrl = (airport) => {
  if (!airport || (!airport.lat && !airport.latitude) || (!airport.lon && !airport.longitude)) return null;
  const lat = airport.lat ?? airport.latitude;
  const lon = airport.lon ?? airport.longitude;
  const params = new URLSearchParams({
    center: `${lat},${lon}`,
    zoom: "6",
    size: "600x400",
    maptype: "roadmap",
  });
  return `/.netlify/functions/maps?${params.toString()}`;
};

export default App;