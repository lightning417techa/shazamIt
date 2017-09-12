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

    // create WAV download link using audio data blob
    // createDownloadLink();

    // create audio buffer that can be thumbprinted
    createAudioBuffer();

    recorder.clear();
  }

  function createDownloadLink() {
    recorder && recorder.exportWAV(function(blob) {
      var url = URL.createObjectURL(blob);
      var li = document.createElement('li');
      var au = document.createElement('audio');
      var hf = document.createElement('a');

      au.controls = true;
      au.src = url;
      hf.href = url;
      hf.download = new Date().toISOString() + '.wav';
      hf.innerHTML = hf.download;
      li.appendChild(au);
      li.appendChild(hf);
      recordingslist.appendChild(li);
    });
  }

  function createAudioBuffer() {
    recorder && recorder.getBuffer(getBufferCallback);
  }

  function getBufferCallback( buffers ) {
    console.log('buffers: ', buffers);
    console.log('recorder: ', recorder);
    var frameBufferSize = recorder.config.bufferLen;
    // var bufferSize = (frameBufferSize/2);
    let bufferSize = recorder.context.sampleRate;
    console.log('bufferSize: ', bufferSize);

    let interlevedSignal = interleave(buffers[0], buffers[1]);

    let signal = downsampleBuffer(interlevedSignal, 2048, bufferSize);
    console.log('signal: ', signal);

    // var signal = new Float32Array(bufferSize);

    var fft = new FFT(2048, 44100);

    fft.forward(signal);
    var spectrum = fft.spectrum;
  }

  // Convert stereo signal into a mono signal
  function interleave(inputL, inputR){
    var result = new Float32Array(inputL.length);
    for (var i = 0; i < inputL.length; ++i)
      result[i] = 0.5 * (inputL[i] + inputR[i]);
    return result;
  }

  function downsampleBuffer(buffer, rate, sampleRate) {
      if (rate == sampleRate) {
          return buffer;
      }
      if (rate > sampleRate) {
          throw "downsampling rate show be smaller than original sample rate";
      }
      var sampleRateRatio = sampleRate / rate;
      var newLength = Math.round(buffer.length / sampleRateRatio);
      var result = new Float32Array(newLength);
      var offsetResult = 0;
      var offsetBuffer = 0;
      while (offsetResult < result.length) {
          var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
          var accum = 0, count = 0;
          for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
              accum += buffer[i];
              count++;
          }
          result[offsetResult] = accum / count;
          offsetResult++;
          offsetBuffer = nextOffsetBuffer;
      }
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