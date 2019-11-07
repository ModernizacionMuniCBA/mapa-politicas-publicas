/// <reference path="jquery-3.4.1.min.js" />

var _localData;
/** Representa al contenedor de tooltip. */
var _tooltipDlg = null;
/** Representa el contenedor con información sobre cada una de las prov / municipios. */
var _infoDlg = null;
/** Representa el contenedor con las preguntas correspondiente al municipio. */
var _municipiosDlg = null;

var _map = null;

/* == Imports de OpenLayer == */
var Feature = ol.Feature;
var Map = ol.Map;
var View = ol.View;
var GeoJSON = ol.format.GeoJSON;
var Circle = ol.geom.Circle;
var {Tile, Vector} = ol.layer;
var TileLayer = Tile;
var VectorLayer = Vector;
var {Circle2, Fill, Stroke, Style} = ol.style;
var CircleStyle = Circle2;
var {OSM} = ol.source;
var VectorSource = ol.source.Vector;
var Control = ol.control;
/* ========================== */

$(document).ready(function() {
    initContainers();
    
    initMap();

    loadData();

    // Evento de click sobre el boton de municipios.
    _municipiosDlg.on("click", ".muniButton", function() {
        let curEl = $(this);
        let provID = parseInt(curEl.attr("data-pid"), 10);
        let muniID = parseInt(curEl.attr("data-id"), 10);
        
        showMunicipiosData(curEl, provID, muniID);
    }).on("click", ".politica_button", function() {
        let curEl = $(this);
        showPoliticasRespuestas(curEl);
    });

});

/**
 * Muestra la información de las distintas políticas aplicadas.
 * @param curEl Elemento clickeado.
 */
function showPoliticasRespuestas(curEl) {
    let politicaID = parseInt(curEl.attr("data-pid"), 10);

    if (toggleContainer_RespuestasPoliticas(curEl, politicaID)) return;

    let muniButton = curEl.parents("li").find(".muniButton");
    let provID = parseInt(muniButton.attr("data-pid"), 10);
    let muniID = parseInt(muniButton.attr("data-id"), 10);
    let provData = getProvinciaData_byID(provID);

    if (provData) {
        let muniData = getMunicipioData_byID(muniID, provData);

        if (muniData) {
            let respData = muniData.Respuestas[0].respuestas[politicaID];
            let preguntas = _localData.preguntas;

            if (respData) {
                let htmlCode = "<div class='p_infoCont' data-pid='" + politicaID + "'><ul class='ul_vnostyle'>";
                // recorremos todas las preguntas
                
                for (let i = 0; i < preguntas.length; i++) {
                    let curPregunta = preguntas[i];
                    
                    // Verificamos si la pregunta actual tiene sub items.
                    if (curPregunta.subItems) {
                        let preguntas = curPregunta.subItems;

                        // recorremos todas las preguntas de la consigna actual
                        for (let j = 0; j < preguntas.length; j++) {
                            htmlCode += "<li>";
                            htmlCode += "<div class='p_ic_pName'>" + preguntas[j].nombre + "</div>";
                            
                            // recorremos las respuestas de la pregunta actual.
                            for (let k = 0; k < respData.length; k++) {
                                if (respData[k].pregID === j) htmlCode += "<div class='p_ic_pTxt'>" + respData[k].texto + "</div>";
                            }

                            htmlCode += "</li>";
                        }
                    }
                }

                htmlCode += "</ul></div>";

                $(htmlCode).insertAfter(curEl);
                curEl.next(".p_infoCont").slideDown(150);
                curEl.children(".downArrow").addClass("upArrow");
            }
        }
    }
}

/**
 * Obtiene la información de un municipio.
 * @param index ID del municipio. El ID corresponde al índice del municipio
 * dentro del array.
 * @param provData Array con toda la información de las provincias.
 */
function getMunicipioData_byID(index, provData) {
    return provData.Data[index] ? provData.Data[index] : null;
}

/**
 * Muestra la información de un municipio.
 * @param curEl Elemento HTML disparador del evento.
 * @param provID ID de la provincia.
 * @param muniID ID del municipio
 */
function showMunicipiosData(curEl, provID, muniID) {
    let provData = getProvinciaData_byID(provID)
    let muniData = getMunicipioData_byID(muniID, provData);

    if (!toggleContainer_RespuestasMunicipios(curEl, provID, muniID)) {
        // Nos aseguramos que haya información para la provincia seleccionada.
        if (provData) {
            // Obtenemos información del municipio seleccionado.
            if (muniData) {
                let htmlCode = generateHTMLCode_MunicipiosData(muniData, provID, muniID);

                $(htmlCode).insertAfter(curEl);
                curEl.next(".consignaMainCont").slideDown(150);
                curEl.children(".downArrow").addClass("upArrow");
            }
        }
    }
}

/**
 * Genera el código HTML con las consignas perteneciente al municipio seleccionado.
 * @param {*} muniData Información del municipio.
 * @param {*} provID ID de la provincia a la que pertenece el municipio.
 * @param {*} muniID ID del municipio.
 */
function generateHTMLCode_MunicipiosData(muniData, provID, muniID) {
    let preguntas = _localData.preguntas;
    let htmlCode = "";
    let respData = muniData.Respuestas;

    htmlCode += "<div class='consignaMainCont' data-pid='" + provID + "' data-id='" + muniID + "'>";
    // Recorremos todas las consignas / preguntas.
    for (let i = 0; i < preguntas.length; i++) {
        let consigna = preguntas[i];
        let consignaDesc = consigna.consigna;

        htmlCode += "<div class='consignaCont' data-cid='" + i + "'>";
        htmlCode += "<h2>Consigna nº" + (i+1) + "</h2>";

        // Si nos encontramos en la primer consigna, mostraremos el listado de todas
        // las politicas.

        // La primer consigna es generalmente la que contiene a su vez
        // sub-items, por lo que debemos representarla de manera diferenciada.
        // De momento está hard-coded pero en un futuro puede implementarse
        // una propiedad en "data.json" para diferenciar consignas con sub-consignas.
        if (consigna.subItems) {
            htmlCode += "<p>" + consignaDesc + "</p>";
            htmlCode += "<ul class='politicasList'>";
            // recorremos todas las respuestas del municipio.
            for (let j = 0; j < respData[i].respuestas.length; j++) {
                htmlCode += "<li><span class='politica_button' data-pid='" + j + "'>";
                htmlCode += (j + 1) + ". " + respData[i].respuestas[j][0].texto;
                htmlCode += "<span class='downArrow'></span></span></li>";
            }
            htmlCode += "</ul>";
        }
        else {
            htmlCode += "<div class='p_ic_pName'>" + consignaDesc + "</div>";
            htmlCode += "<div class='p_ic_pTxt'>" + respData[i].respConsigna + "</div>";
        }
        htmlCode += "</div>";
    }

    htmlCode += "</div>";
    return htmlCode;
}

/**
 * Inicializa el mapa, dibujando los polígonos/tiles y registrando eventos.
 */
function initMap() {
    showLoadingImage(".mapLoader");

    // Cargamos los polígonos de las provincias.
    var provSource = new VectorSource({
        url: "data/polys/provincia.geojson",
        format: new GeoJSON()
    });

    var provLayer = new VectorLayer({ source: provSource });

    // creamos una nueva instancia del mapa.
    _map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            }),
            provLayer
        ],
        view: new ol.View({
            center: ol.proj.transform([-62.4201,-40.1888], 'EPSG:4326', 'EPSG:3857'),
            zoom: 4
        })
    });

    registerMapEvents(_map, provSource, provLayer);
}

/**
 * Inicializa todas las variables globales que representan contenedores principales,
 * de manera tal que no se tenga que analizar toda la DOM cada vez que se requiera trabajar
 * con dichos elementos.
 */
function initContainers() {
    // Contenedor de tooltips.
    _tooltipDlg = $("#tooltip");
    // Contenedor principal de información
    _infoDlg = $("#infoCont");
    // Contenedor principal con el listado de municipios.
    _municipiosDlg = $("#ic_municipios");
}

/**
 * Carga el JSON que contiene la información de las provincias y municipios.
 */
function loadData() {
    $.getJSON("./data/data.json", function(json) {
        if (json) _localData = json;
    });
}

/**
 * Establece el estilo de los tiles del mapa basado en la información que haya disponible.
 * @param {*} provSource 
 * @param {*} map Mapa en el cual se encuentran los tiles.
 */
function setTileStyle(provSource, map) {
    let extent = map.getView().calculateExtent(map.getSize());
    let data = _localData;

    provSource.forEachFeatureInExtent(extent, function(feature) {
        if (feature) {
            let curProv = feature.values_;
            let provName = curProv.NAM;

            // recorremos la data de las provincias
            for (let i = 0; i < data.provincias.length; i++) {
                let curProvData = data.provincias[i];
                if (curProvData) {
                    if (curProvData.NAM == provName) {
                        feature.setStyle(new Style({
                            stroke: new Stroke({
                                color: "rgba(200,20,20,0.8)",
                                width: 2
                            }),
                            fill: new Fill({
                                color: "rgba(200,20,20,0.2)"
                            })
                        }));

                        feature.set("curData", curProvData);
                    }
                }
            }
        }
    });
}

/**
 * Registra eventos relacionados al mapa.
 * @param {*} map Instancia del mapa al cual se van a registrar los eventos.
 */
function registerMapEvents(map, provSource, provLayer) {
    // Registramos por UNICA VEZ (map.ONCE) el evento que se dispara cuando
    // se terminan de renderizar los tiles que se encuentran dentro del viewport.
    map.once("rendercomplete", () => {
        setTileStyle(provSource, map, provLayer);

        removeLoadingImage(".mapLoader");
        $(".map").css("visibility", "visible");
    });

    // Registramos eventos de movimiento de puntero sobre el mapa.
    map.on("pointermove", function(evt) {
        if (evt.dragging) return;
        changeCursorOnMapHover(map, evt);

        displayTooltipInfo(map, map.getEventPixel(evt.originalEvent));
    });

    // Ocultamos el tooltip cuando el mouse sale de la vista del mapa.
    map.getViewport().addEventListener("mouseout", function(event) {
        _tooltipDlg.hide().html("");
    }, false);
    
    map.on("click", function(evt) {
        onTileClick_Handler(map, evt);
    });
}

var _lastFeature, _lastStyle;
function onTileClick_Handler(map, evt) {
    let features = map.getFeaturesAtPixel(evt.pixel);
    if (!features) return;

    let curFeature = features[0];
    let curProv = getProvinciaData_byName(curFeature.values_.NAM);
    if (!curProv) return;
    updateDisplay_municipios(curProv);

    if (_lastFeature) {
        _lastFeature.setStyle(_lastStyle);
    }

    _lastFeature = curFeature;
    _lastStyle = _lastFeature.getStyle();

    curFeature.setStyle(new Style({
        stroke: new Stroke({
            color: "rgba(200,20,20,0.8)",
            width: 2
        }),
        fill: new Fill({
            color: "rgba(20,20,250,0.2)"
        })
    }));
    
    let fitOptions = { duration: 750 };
    map.getView().fit(curFeature.getGeometry(), fitOptions);
}

function displayTooltipInfo(map, pixel) { 
    let xPos = pixel[0] + "px";
    let yPos = (pixel[1] - 25);
    let curFeature = map.forEachFeatureAtPixel(pixel, function(feature) {
        return feature;
    });

    let mapDivOffset = $(window);

    if (curFeature) {
        let curData = curFeature.values_;
        _tooltipDlg.html(curData.NAM);

        yPos += mapDivOffset.scrollTop();
        yPos += "px";

        // Acomodamos la ubicación del tooltip.
        _tooltipDlg.css({"left": xPos, "top": yPos}).fadeIn(200);
    }
    else _tooltipDlg.hide();
}

function displayTileInfo(map, pixel) {
    let xPos = pixel[0] + "px";
    let yPos = (pixel[1] - 25) + "px";
    let curFeature = map.forEachFeatureAtPixel(pixel, function(feature) {
        return feature;
    });

    if (curFeature) {
        let curData = curFeature.values_;
        
        _tooltipDlg.html(curData.NAM);
        // Acomodamos la ubicación del tooltip.
        _tooltipDlg.css({"left": xPos, "top": yPos}).fadeIn(150);

        let infoCont = $("#infoCont");

        infoCont.html("<ul>");

        // Recorremos los datos de la provincia
        for (let i = 0; i < curData.curData.Data.length; i++) {
            let curVal = curData.curData.Data[i];
            infoCont.append("<li>");
            infoCont.append(curVal.Municipio);
            infoCont.append("</li>");
        }

        infoCont.append("</ul>");
    }
    else _tooltipDlg.hide();
}

function getProvinciaData_byName(provName) {
    let provData = null;

    // recorremos la data de las provincias
    for (let i = 0; i < _localData.provincias.length; i++) {
        let curProvData = _localData.provincias[i];
        if (curProvData) {
            if (curProvData.NAM == provName) {
                provData = {
                    Index: i,
                    Data: curProvData
                };
                break;
            }
        }
    }

    return provData;
}

/**
 * Obtiene la información de una provincia según su ID.
 * @param provID ID de la provincia. El ID corresponde al índice de la provincia
 * dentro del array.
 */
function getProvinciaData_byID(provID) {
    return _localData.provincias[provID] ? _localData.provincias[provID] : null;
}

var _pointsVectorSource = null;
function updateDisplay_municipios(provData) {
    let htmlCode = "<ul class='ul_vnostyle'>";
    let curData = provData.Data.Data;
    let markers = [];

    if (_pointsVectorSource) _pointsVectorSource.clear();

    for (let i = 0; i < curData.length; i++) {
        let municipio = curData[i];

        if (municipio) {
            htmlCode += "<li>";
            htmlCode += "<div class='muniButton' data-pid='" + provData.Index + "' data-id='" + i + "'>";
            htmlCode += "<span class='muniName'>" + municipio.Organismo + " - " + municipio.Municipio + "</span>";
            htmlCode += "<span class='muniDir'>" + municipio.Direccion + "</span>";
            htmlCode += "<span class='downArrow'></span></div>";
            htmlCode += "</li>";

            let marker = new ol.Feature({
                geometry: new ol.geom.Point(
                    ol.proj.fromLonLat([municipio.Long, municipio.Lat])
                ),
            });

            marker.on("pointermove", function(evt) {
                if (evt.dragging) return;
                changeCursorOnMapHover(_map, evt);
        
                //displayTooltipInfo(_map, _map.getEventPixel(evt.originalEvent));
            });

            markers.push(marker);
        }
    }

    htmlCode += "</ul>";

    _municipiosDlg.html(htmlCode);
    
    _pointsVectorSource = new ol.source.Vector({ features: markers });
    let markerVectorLayer = new ol.layer.Vector({
        source: _pointsVectorSource,
    });
    _map.addLayer(markerVectorLayer);
}

/**
 * Muestra/oculta los contenedores con las respuestas de las políticas aplicadas por
 * municipios.
 * @param {*} senderEl Elemento disparador del evento.
 * @param {*} politicaID ID de la política a mostrar.
 */
function toggleContainer_RespuestasPoliticas(senderEl, politicaID) {
    // si existe un elemento <div> con el atributo "data-pid" entendemos
    // que los datos ya se anexaron al DOM, por lo tanto en lugar de volver a anexar
    // mostramos / ocultamos el contenedor.
    
    // representa el contenedor de respuestas
    let respContainer = senderEl.parent("li").find("div[data-pid='" + politicaID + "']");
    
    return toggleContainerVisibility(respContainer, senderEl);
}

function toggleContainer_RespuestasMunicipios(senderEl, provID, muniID) {
    let respContainer = senderEl.parent("li").find("div.consignaMainCont[data-pid='" + provID + "'][data-id='" + muniID + "']");

    return toggleContainerVisibility(respContainer, senderEl);
}

function toggleContainerVisibility(element, senderEl) {
    // el contenedor existe
    if (element.length != 0) {
        if (element.is(":visible")) {
            element.slideUp(150);
            senderEl.children(".downArrow").removeClass("upArrow");
        }
        else {
            element.slideDown(150);
            senderEl.children(".downArrow").addClass("upArrow");
        }
        return true;
    }
    return false;
}

function changeCursorOnMapHover(map, evt) {
    map.getTargetElement().style.cursor = map.hasFeatureAtPixel(map.getEventPixel(evt.originalEvent)) ? 'pointer' : '';
}

function showLoadingImage(elementName) {
    $(elementName).html("<div class='loadingSpinner'></div>");
}

function removeLoadingImage(elementName) {
    $(elementName).find(".loadingSpinner").remove();
}
