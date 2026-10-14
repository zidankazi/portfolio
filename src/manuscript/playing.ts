// A small playback cue; the song status provides the accessible description.
export const playingMarkup='<span class="now-playing" aria-hidden="true"><span></span><span></span><span></span><span></span></span>';

export function playbackBars(time:number):number[] {
  return [0,.15,.3,.1].map(delay=>.2+.65*(1-Math.cos((time/1200-delay)*Math.PI*2))/2);
}
