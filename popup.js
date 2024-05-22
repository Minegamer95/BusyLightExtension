'use strict';
window.onload = async () => {
  let hasInit = false;
  let isDevelopeOptionOn = true;

  if (isDevelopeOptionOn){

  }
  else{
    document.getElementById("Testing").hidden = true;
  }
  function clampValue(variable, minValue, maxValue) {
    // Try parsing the variable as an integer
    const intValue = parseInt(variable);

    // Check if the parsed value is a valid integer
    if (!isNaN(intValue)) {
        // Clamp the parsed integer to the specified range
        return Math.min(Math.max(intValue, minValue), maxValue);
    } else {
        // Return the minimum value if parsing fails or if the variable is not a number
        return minValue;
    }
}
function updateColor(directUpdate = false) {
    // Holen Sie sich die Werte der roten, grünen und blauen Farbkomponenten
    if (!hasInit)
      return;

    if(directUpdate)
      chrome.runtime.sendMessage({action: "setColorDirect", data: color});
    else
      chrome.runtime.sendMessage({action: "setColor", data: color});
}
function setColor(r, g, b){
  if (!hasInit)
    return;
    sliderRed.state.value = r;
    sliderGreen.state.value = g;
    sliderBlue.state.value = b;

    // Setzen Sie die Hintergrundfarbe des Vorschaubereichs entsprechend den eingegebenen Farbwerten
    document.getElementById('colorDiff').style.backgroundColor = 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
}
function showColorPicker() {
    // Zeige den Farbwähler an
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.addEventListener('change', function() {
        const selectedColor = colorPicker.value;
        const hex = selectedColor.substring(1); // Entferne das '#'-Zeichen
        const r = parseInt(hex.substring(0, 2), 16); // R-Wert
        const g = parseInt(hex.substring(2, 4), 16); // G-Wert
        const b = parseInt(hex.substring(4, 6), 16); // B-Wert

        setColor(r, g, b);
        updateColor();
    });
    colorPicker.click();
}
function createSlider(name, minValue = 0, maxValue = 255, update = function(col, changedBySlider){}) {
  // Create a container div element
  const baseID = name+Date.now();

  const containerDiv = document.createElement('div');
  containerDiv.id = baseID;
  containerDiv.style.padding = '2px';

  //#region CreateLabel
  const label = document.createElement('label');
  label.textContent = name+":";
  label.setAttribute('for', "input"+baseID);
  label.id = "lable"+baseID;
  //#endregion CreateLabel

  //#region CreateSlider
  const slider = document.createElement('input');
  slider.id = "input"+baseID;
  slider.type = 'range';
  slider.min = minValue;
  slider.max = maxValue;
  slider.value = minValue;
  slider.style.display = 'block';
//#endregion CreateSlider
  
//#region CreateDisplayValue
  const sliderValue = document.createElement('div');
  sliderValue.id = "value"+baseID;
  sliderValue.innerHTML = slider.value;
//#endregion CreateDisplayValue
  
  const state = {
    _value: minValue, // Initial value
    _slider: slider,
    _sliderValue: sliderValue,
    get value() {
      return this._value;
    },
    set value(newValue) {
      const setValue = clampValue(newValue, minValue, maxValue);
      const hasChanged = setValue != this._value;
      const changedBySlider = setValue == slider.value;
      if(hasChanged)
      {
        this._value = setValue;
        update(setValue, changedBySlider);
      }
      // Update the display element whenever the value changes
      if(!changedBySlider)
        {
          slider.value = setValue;
          sliderValue.innerHTML = setValue;
        }
    }
  }

  // Function to update the slider value display
  function updateSliderValue() {
      sliderValue.innerHTML = slider.value;
      if (state.value != slider.value)
        state.value = slider.value;
    };

  // Add event listener to update the value display when the slider is moved
  slider.addEventListener('input', updateSliderValue);

  // Append the slider and the value display to the container div
  containerDiv.appendChild(label);
  containerDiv.appendChild(slider);
  containerDiv.appendChild(sliderValue);

  const result = {element:containerDiv, state}
  // Return the container div
  return result;
}
function createButtons(myModesList, parentContainer = "modeContainerBtns")
{
  const divElement = document.getElementById(parentContainer);
  myModesList.forEach(element => {
    const button = document.createElement('button');
    button.textContent = element.name;
    button.style.margin = "2px";

    button.onclick = function() {
      setColor(element.color.r, element.color.g, element.color.b);
      updateColor();
    };

    divElement.appendChild(button);
  });
}
function setAudio(myUpdate, myVolume, myRingtone)
{
  const mode = {
    update: myUpdate,
    ringtone: myRingtone,
    volume: myVolume
  }
  chrome.runtime.sendMessage({action: "setAudio", data: mode});
}

//#region Regier Variables
let color = {
    r: 0,
    g: 0,
    b: 0,
}
let colorsDiv = document.getElementById('colorsDiv');

let sliderRed   = createSlider("Rot" , 0, 255, (red, bySlider)   => {color.r = red; if(bySlider)updateColor(true);});
let sliderGreen = createSlider("Grün", 0, 255, (green, bySlider) => {color.g = green; if(bySlider)updateColor(true);});
let sliderBlue  = createSlider("Blau", 0, 255, (blue, bySlider)  => {color.b = blue; if(bySlider)updateColor(true);});

colorsDiv.appendChild(sliderRed.element);
colorsDiv.appendChild(sliderGreen.element);
colorsDiv.appendChild(sliderBlue.element);

let testBtn = document.getElementById('testBtn');
let test2Btn = document.getElementById('test2Btn');
//#endregion

//#region Register Listeners
// Button Click Listernes
document.getElementById('ColorPickerBtn').addEventListener('click', showColorPicker);

let connectBtn = document.getElementById('ConnectBackgroundBtn');
connectBtn.addEventListener("click", async () => {
    const currentUrl = window.location.href;
    console.log("Aktuelle URL:", currentUrl);
    navigator.clipboard.writeText(currentUrl)
        .then(() => {
          console.log("Text erfolgreich in die Zwischenablage kopiert:", currentUrl);
        })
        .catch(err => {
          console.error("Fehler beim Kopieren des Textes in die Zwischenablage:", err);
        });

    await navigator.hid.requestDevice({ 
        filters: [{ vendorId: 0x27bb }] 
    });
    chrome.runtime.sendMessage("newDevice");
  });

let reconnectBtn = document.getElementById('ReconnectBtn');
reconnectBtn.addEventListener("click", async () => {
    const currentUrl = window.location.href;
    console.log("Aktuelle URL:", currentUrl);
    navigator.clipboard.writeText(currentUrl)
        .then(() => {
          console.log("Text erfolgreich in die Zwischenablage kopiert:", currentUrl);
        })
        .catch(err => {
          console.error("Fehler beim Kopieren des Textes in die Zwischenablage:", err);
        });
    chrome.runtime.sendMessage("newDevice");
  });


test2Btn.addEventListener('click', () => {
  const vol = clampValue(document.getElementById('input1').value, 0, 255);
  const up = clampValue(document.getElementById('input2').value, 0, 255);
  const rin = clampValue(document.getElementById('input3').value, 0, 255);

  setAudio(up, vol, rin);
});

testBtn.addEventListener('click', () => {
  document.getElementById('input3').value = clampValue(document.getElementById('input3').value, 0, 244) + 1;
  if(document.getElementById('input3').value > 10)
    document.getElementById('input3').value = 0;
  setAudio(1, 0, 1);
});

// Message Listerner
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === "idleStateChanged") {
        handleStateChanged(message.data);
      }
  });
//#endregion

chrome.runtime.sendMessage({ action: "getInitData"}, response => {
  console.log("Antwort vom Hintergrundskript:", response);
  hasInit = true;
  color = response.currentColor;
  createButtons(response.setting.modes);
  setColor(color.r, color.g, color.b);
});



function handleStateChanged(newState) {
    console.log('Systemstatus geändert:', newState);
    document.getElementById('output1').value = newState;
  }
handleStateChanged("active");
};


  