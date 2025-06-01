import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import "./App.css";
import airportData from "./airportData.json";
import linesData from "./linesData.json";

// Airport codes for "Atlas oculto de la inmensa ruina"
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

const findAirportByCode = (code) => {
  return airportData.find((a) => a.code === code);
};

const App = () => {
  // Get the Google API key from environment variables
  const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

  const [bubbleStyle, setBubbleStyle] = useState({
    top: "-1000px",
    left: "-1000px",
  });

  const setBubblePosition = (rect, type) => {
    const contentRect = displayRef.current.getBoundingClientRect();
    const infoBubbleRect = bubbleRef.current.getBoundingClientRect();

    const AL = rect.left;
    const AR = contentRect.width - rect.right;
    const AT = rect.top;
    const AB = contentRect.height - rect.bottom;

    const maxHorizontalSpace = Math.max(AL, AR);
    const maxVerticalSpace = Math.max(AT, AB);

    const bubbleStyle = {
      display: "block",
    };

    if (type === "line") {
      bubbleStyle.left = rect.left + (rect.width - infoBubbleRect.width) / 2;
    } else {
      if (maxHorizontalSpace === AL) {
        bubbleStyle.left = rect.left - infoBubbleRect.width;
      } else {
        bubbleStyle.left = rect.right;
      }
    }

    if (maxVerticalSpace === AT) {
      bubbleStyle.top = rect.top - infoBubbleRect.height;
    } else {
      bubbleStyle.top = rect.bottom;
    }

    setBubbleStyle(bubbleStyle);
  };

  const [selectedAirport, setSelectedAirport] = useState(null);
  const [displayPoem, setDisplayPoem] = useState(true);
  const displayRef = useRef();
  const [selectedLineData, setSelectedLineData] = useState(null);
  const [selectedCode, setSelectedCode] = useState(null);
  const bubbleRef = useRef();
  const [highlightedLine, setHighlightedLine] = useState(null);

  useEffect(() => {
    if (
      selectedAirport &&
      selectedCode &&
      bubbleRef.current &&
      displayRef.current
    ) {
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
      const tappedCode = codeTarget.textContent;
      const airport = findAirportByCode(tappedCode);
      setSelectedAirport(airport);
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

  // Helper function to get secure map URL
  const getSecureMapUrl = (airport) => {
    if (!airport || !airport.static_map_url || !GOOGLE_API_KEY) {
      return null;
    }
    // Replace placeholder with actual API key
    return airport.static_map_url.replace('{API_KEY}', GOOGLE_API_KEY);
  };

  let globalLineIndex = 0;

  return (
    <div className="App" ref={displayRef} onClick={handleClick}>
      <div className="content-container">
        <div className="author-container">
          <span className="author-text">Poema de: Pedro Poitevin</span>
        </div>
        <div className="photographer-container">
          <span className="photographer-text">Foto de: Arturo Godoy</span>
        </div>
        <div
          className={`content-window${
            selectedAirport
              ? " selected-airport"
              : selectedLineData
              ? " selected-line-data"
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
                                highlightedLine === currentLineIndex
                                  ? "highlighted-line"
                                  : ""
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
                            className={
                              lineIndex === 0 ? "airport-codes-title" : ""
                            }
                          >
                            {line.split("-").map((code, idx) => (
                              <React.Fragment key={idx}>
                                <span
                                  className={`code${
                                    selectedCode === code
                                      ? " selected-code"
                                      : ""
                                  }`}
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
            <div
              ref={bubbleRef}
              className={`info-bubble${
                selectedAirport || selectedLineData ? " show-info" : ""
              }`}
              style={{
                ...bubbleStyle,
                backgroundImage: selectedAirport
                  ? `url(${getSecureMapUrl(selectedAirport)})`
                  : "none",
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
                    <div className="itinerary">
                      {selectedLineData.itinerary}
                    </div>
                    <div style={{ margin: "10px 0" }} />
                    <div className="length">{selectedLineData.length}</div>
                    <div style={{ margin: "10px 0" }} />
                    <div
                      className="carbon-footprint"
                      dangerouslySetInnerHTML={{
                        __html: selectedLineData["carbon-footprint"].replace(
                          "CO2",
                          "CO<sub>2</sub>"
                        ),
                      }}
                    />
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

export default App;
