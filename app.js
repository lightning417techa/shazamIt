var audio_context;
var recorder;

function __log(e, data) {
  log.innerHTML += "\n" + e + " " + (data || '');
}

function startUserMedia(stream) {
  var input = audio_context.createMediaStreamSource(stream);
  __log('Media stream created.');
  // Uncomment if you want the audio to feedback directly
  //input.connect(audio_context.destination);
  //__log('Input connected to audio context destination.');

  recorder = new Recorder(input);
  __log('Recorder initialised.');
}

function startRecording(button) {
  recorder && recorder.record();
  button.disabled = true;
  button.nextElementSibling.disabled = false;
  __log('Recording...');
}

function stopRecording(button) {
  recorder && recorder.stop();
  button.disabled = true;
  button.previousElementSibling.disabled = false;
  __log('Stopped recording.');

  // create audio buffer that can be thumbprinted
  createAudioBuffer();

  recorder.clear();
}

function createAudioBuffer() {
  recorder && recorder.getBuffer(getBufferCallback);
}

function getBufferCallback( buffers ) {
  const frameBufferSize = recorder.config.bufferLen;
  const bufferSize = recorder.context.sampleRate;
  const interlevedSignal = interleave(buffers[0], buffers[1]);
  const fftData = runFFT(interlevedSignal);
  console.log('fftData: ', fftData);
  return fftData;
}

function runFFT( signal ) {
  console.log('signal: ', signal);
  // Use the in-place mapper to populate the data.
  const data = new ComplexArray(32768).map((value, i, n) => {
    value.real = signal[i];
  });
  console.log('data: ', data);
  drawToCanvas('original', data);
  data.FFT();
  drawToCanvas('fft', data);

  // filter out extreme values???
  data.map((freq, i, n) => {
    if (i > n/5 && i < 4*n/5) {
      freq.real = 0;
      freq.imag = 0;
    }
  });
  drawToCanvas('fft_filtered', data);

  drawToCanvas('original_filtered', data.InvFFT());

  drawToCanvas('all_in_one', data.frequencyMap((freq, i, n) => {
      if (i > n/5 && i < 4*n/5) {
        freq.real = 0;
        freq.imag = 0;
      }
    }));

  return data;
}

// Convert stereo signal into a mono signal
function interleave(inputL, inputR){
  var result = new Float32Array(inputL.length);
  for (var i = 0; i < inputL.length; ++i)
    result[i] = 0.5 * (inputL[i] + inputR[i]);
  return result;
}


window.onload = function init() {
  try {
    // webkit shim
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
    window.URL = window.URL || window.webkitURL;

    audio_context = new AudioContext;
    __log('Audio context set up.');
    __log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
  } catch (e) {
    alert('No web audio support in this browser!');
  }

  navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
    __log('No live audio input: ' + e);
  });
};