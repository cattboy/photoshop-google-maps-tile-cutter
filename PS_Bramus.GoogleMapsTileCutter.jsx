﻿/* * Photoshop Google Maps Tile Cutter * By Bramus Van Damme - http://www.bram.us/ * * Based upon work by Will James (http://onNYTurf.com), Curtis Wyatt (http://gocalipso.com/), and Nate Bundy (http://www.lemonrage.com/) *  */// **** CONFIG - FEEL FREE TO ADJUST    // path where to save the tiles    var targetFolder = Folder.desktop + "/tilecutter/";    // size of the tiles - default Google Maps size: 256    var TILE_SIZE = 256;    // In which format(s) should be save the tiles? - default: jpg only    var saveJPEG = true;    var savePNG = false;    var saveGIF = false;    // wanted backgroundcolor to fill in the blanks when resizing the image    var bgColor = '000000';// **** HELPER FUNCTIONS - DON'T TOUCH!    // via http://www.ps-scripts.com/bb/viewtopic.php?p=343    function takeSnapshot () {        var id686 = charIDToTypeID( "Mk  " );        var desc153 = new ActionDescriptor();        var id687 = charIDToTypeID( "null" );        var ref119 = new ActionReference();        var id688 = charIDToTypeID( "SnpS" );        ref119.putClass( id688 );        desc153.putReference( id687, ref119 );        var id689 = charIDToTypeID( "From" );        var ref120 = new ActionReference();        var id690 = charIDToTypeID( "HstS" );        var id691 = charIDToTypeID( "CrnH" );        ref120.putProperty( id690, id691 );        desc153.putReference( id689, ref120 );        executeAction( id686, desc153, DialogModes.NO );     }    function revertToLastSnapshot() {        var docRef = app.activeDocument;        var hsObj = docRef.historyStates;        var hsLength = hsObj.length;        for (var i = hsLength-1; i > -1; i--) {            if(hsObj[i].snapshot) {                docRef.activeHistoryState = hsObj.getByName('Snapshot ' + i);                break;           }              }           }    function revertToSnapshot(snapshotID) {      curDoc.activeHistoryState = curDoc.historyStates[snapshotID];    }    function getLastSnapshotID() {        var docRef = app.activeDocument;        var hsObj = docRef.historyStates;        var hsLength = hsObj.length;        for (var i = hsLength-1; i > -1; i--) {            if(hsObj[i].snapshot) {                return i;                break;           }              }           }    function getVisibleLayers(doc) {        var tempArray = new Array();        for (var i = 0; i < doc.layers.length; i++)        {            if (doc.layers[i].visible)                tempArray.push(i);        }        return tempArray;    }    function isLayerEmpty(doc, layer) {      if (!doc) {        doc = app.activeDocument;      }      if (!layer) {        layer = doc.activeLayer;      }      return parseInt(layer.bounds.toString().replace(/\D/g,"")) == 0;    }    function visibleLayersEmpty(doc) {        var bool = true;        if (!doc) {            doc = app.activeDocument;        }        for (var i = 0; i < visibleLayers.length; i++)        {            bool = isLayerEmpty(doc, doc.layers[visibleLayers[i]]);            if (!bool)                return bool;        }        return bool;    }// **** MAIN CORE - DON'T TOUCH!    // No active document, stop here    if (app.documents.length === 0) {        alert("Please open a file", "TileCutter Error", true);        app.beep();    }     // Make sure the target folder Exists    else if (!new File(targetFolder).exists) {        alert("The target folder (" + targetFolder + ") does not exist.\nPlease create it before running this script", "TileCutter Error", true);        app.beep();    }    // Active document and folder exists, process it    else {        // Make sure we're using pixels        var startRulerUnits = app.preferences.rulerUnits;        app.preferences.rulerUnits = Units.PIXELS;        // Active document shorthand        var curDoc = app.activeDocument;        // Define max tile dimensions        var maxTileDim = Math.ceil(Math.max(curDoc.width.value, curDoc.height.value) / TILE_SIZE);        // Define max and min zoom level        var minZoomLevel = 0,            maxZoomLevel = 0;        do {            maxZoomLevel++;        } while (Math.pow(2, maxZoomLevel) < maxTileDim);        // Take initial snapshot. We'll go back to this once we're finished to leave the document in the state we started        takeSnapshot();        var InitialSnapshotID = getLastSnapshotID();        // Resize to a square version & center image - this way we get an image size that's easily tileable (512, 1028, 2048, 4096, ...)        var bgColorHex = new SolidColor();        bgColorHex.rgb.hexValue = bgColor;        app.backgroundColor = bgColorHex;        curDoc.resizeCanvas(TILE_SIZE * Math.pow(2, maxZoomLevel), TILE_SIZE * Math.pow(2, maxZoomLevel), AnchorPosition.MIDDLECENTER);                // Find the visible layers        var visibleLayers = getVisibleLayers(curDoc);        // Store current zoom level        var ZoomLevel = maxZoomLevel;        // Do the following for each zoom level the user wants        while (ZoomLevel >= minZoomLevel)        {                    // Resize the canvas to fit the zoom level (50% per zoom level step)            if (ZoomLevel < maxZoomLevel) {                curDoc.resizeImage(curDoc.width.value * 0.5, curDoc.height.value * 0.5);            }                        // Take a snapshot for this zoom level            takeSnapshot();            var ZoomLevelSnapshotID = getLastSnapshotID();                        // Calculate the number of tiles we'll need            var xTiles = parseInt(curDoc.width.value, 10) / TILE_SIZE; // num tiles on the x axis            var yTiles = parseInt(curDoc.height.value, 10) / TILE_SIZE; // num tiles on the y axis            var TotalTiles = xTiles * yTiles; // total tiles (numX * numY)                        // Counters to track which x value and which y value we are on in our image tile grid            var tileX = 0;            var tileY = 0;                        // Cut 'em up            // For each tile we need to make, we repeat each step in this loop            for (n = 1; n < TotalTiles + 1; n++)            {                            // We cut up tiles column by column                // I.E. we cut up all the tiles for a given x value before moving on to the next x value.                // We do this by checking if the y value we are on is the last tile in a column                 // We compare our y counter to our total y number of Tiles, if they are the same is we do the following                if (parseInt(tileY, 10) == parseInt(yTiles, 10))                {                       tileX += 1; // move to next column                    tileY = 0; // start back at the top                }                                // Crop out needed square tile                           curDoc.crop(Array(tileX * TILE_SIZE, tileY * TILE_SIZE, tileX * TILE_SIZE + TILE_SIZE, tileY * TILE_SIZE + TILE_SIZE));                                if (!visibleLayersEmpty(curDoc))                {                                                            //Save the file                    if (saveGIF)                    {                        //Set path to file and file name                        saveFile = new File(targetFolder + ZoomLevel + "_" + tileX + "_" + tileY + ".gif");                            //Set save options                        gifSaveOptions = new GIFSaveOptions();                        gifSaveOptions.colors = 64;                        gifSaveOptions.dither = Dither.NONE;                        gifSaveOptions.matte = MatteType.NONE;                        gifSaveOptions.preserveExactColors = 0;                        gifSaveOptions.transparency = 1;                        gifSaveOptions.interlaced = 0;                        curDoc.saveAs(saveFile, gifSaveOptions, true, Extension.LOWERCASE);                    }                                    if (savePNG)                    {                        //Set path to file and file name                        saveFile = new File(targetFolder + ZoomLevel + "_" + tileX + "_" + tileY + ".png");                            pngSaveOptions = new PNGSaveOptions();                        pngSaveOptions.interlaced = 0;                        curDoc.saveAs(saveFile, pngSaveOptions, true, Extension.LOWERCASE);                    }                                    if (saveJPEG)                    {                        //Set path to file and file name                        saveFile = new File(targetFolder + ZoomLevel + "_" + tileX + "_" + tileY + ".jpg");                            jpegSaveOptions = new JPEGSaveOptions();                        jpegSaveOptions.formatOpsions = FormatOptions.STANDARDBASELINE;                        jpegSaveOptions.matte = MatteType.NONE;                        jpegSaveOptions.quality = 5;				                        curDoc.saveAs(saveFile, jpegSaveOptions, true, Extension.LOWERCASE);                    }                                }                            // Revert to zoom snapshot                revertToSnapshot(ZoomLevelSnapshotID);                // Move to next tile in column                tileY += 1;                            }                 // move to next zoom level            ZoomLevel--;                    }        // Revert to first snapshot (before we started cutting tiles)        revertToSnapshot(InitialSnapshotID);                // Restore application preferences        app.preferences.rulerUnits = startRulerUnits;    }// EOF