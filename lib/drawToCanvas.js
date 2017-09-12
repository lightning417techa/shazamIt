function drawToCanvas(element_id, data) {
  const element = document.getElementById(element_id);
  // const width = element.clientWidth;
  // const height = element.clientHeight;
  const width = '500';
  const height = '100';
  const n = data.length;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  element.appendChild(canvas);

  const context = canvas.getContext('2d');
  context.strokeStyle = 'blue';
  context.beginPath();
  data.forEach((c_value, i) => {
    context.lineTo(i * width / n, height/2 * (1.5 - c_value.real));
  });
  context.stroke();
}