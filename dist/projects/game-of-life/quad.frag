#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_texture;
uniform vec2 u_texture_size;

void main() {
  gl_FragColor = texture2D(u_texture, gl_FragCoord.xy / u_texture_size);
}
