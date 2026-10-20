import type {Track} from './spotify.ts';
import {playingMarkup} from './playing.ts';

export type BioTrack = Pick<Track,'title' | 'artist' | 'isPlaying' | 'albumArt'>;
export type BioImage = {src:string; alt:string; kind:'league' | 'cs2' | 'album'};
export type BioBlock = {kind:'name' | 'body' | 'label' | 'hobby' | 'music'; text:string; gap:number; accent?:boolean; image?:BioImage; music?:{status:string;title:string;artist:string | null;isPlaying:boolean}};

export function biographyBlocks(track:BioTrack | null=null):BioBlock[] {
  const album=track?.albumArt?.startsWith('https://i.scdn.co/image/') ? track.albumArt : null;
  return [
    {kind:'name',text:"I'm Zidan Kazi",gap:12},
    {kind:'body',text:"I'm a junior at Stevens Institute of Technology studying Computer Science & Math. I'm currently in Hoboken, New Jersey.",gap:20},
    {kind:'body',text:"Right now I'm building Mavri. We use fine-tuned diffusion models to make campaign visuals for brands, with tools for production, feedback, and approvals. Some of our clients include Four Seasons, Nespresso, Sephora, and Tiffany & Co.",gap:20},
    {kind:'body',text:"I also co-founded Relic, a shared memory for teams and AI agents. It connects to the tools a company already uses and makes its decisions, conversations, and context easy to find.",gap:20},
    {kind:'body',text:"Before that, I interned at Trenchant Analytics, where I built military drone software that brought real-time computer vision, tactical maps, and augmented reality into HoloLens headsets.",gap:24},
    {kind:'label',text:'Outside of coding',gap:8},
    {kind:'hobby',text:'I like trying new foods.',gap:12},
    {kind:'hobby',text:'I play League of Legends. I used to be Challenger (top 300 out of 3,000,000).',gap:12,image:{src:'/manuscript/league.png',alt:'League of Legends logo',kind:'league'}},
    {kind:'hobby',text:'I also collect CS2 skins. Right now I have a FN Damascus Steel Karambit and MW Snow Leopards.',gap:24,image:{src:'/manuscript/cs2.jpg',alt:'Counter-Strike 2 logo',kind:'cs2'}},
    ...(track?.title ? [{
      kind:'music' as const,
      text:(track.isPlaying ? "Right now I'm listening to " : 'I last listened to ')+track.title+(track.artist ? ' by '+track.artist : ''),
      gap:24,
      music:{status:track.isPlaying ? "Right now I'm listening to" : 'I last listened to',title:track.title,artist:track.artist ?? null,isPlaying:track.isPlaying},
      ...(album ? {image:{src:album,alt:track.title+' album cover',kind:'album' as const}} : {}),
    }] : []),
  ];
}

export type BioInline = {text:string;image?:BioImage;accent?:boolean;noBreak?:boolean};

// Bind game artwork and named phrases to the words they describe.
export function biographyInline(block:BioBlock):BioInline[] {
  const parts:BioInline[]=[];
  let cursor=0;
  for (const match of block.text.matchAll(/Mavri|Relic|Trenchant Analytics|FN Damascus Steel Karambit|MW Snow Leopards\.?|League of Legends|Challenger|CS2 skins/g)) {
    const start=match.index!;
    if (start>cursor) parts.push({text:block.text.slice(cursor,start)});
    const text=match[0];
    const image=(text==='League of Legends' && block.image?.kind==='league') || (text==='CS2 skins' && block.image?.kind==='cs2') ? block.image : undefined;
    parts.push({text,noBreak:true,...(image ? {image} : {}),...(['Mavri','Relic','Trenchant Analytics','League of Legends','Challenger','CS2 skins','FN Damascus Steel Karambit','MW Snow Leopards'].includes(text.replace(/\.$/,'')) ? {accent:true} : {})});
    cursor=start+text.length;
  }
  if (cursor<block.text.length) parts.push({text:block.text.slice(cursor)});
  return parts;
}

const escape=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
export function biographyMarkup(track:BioTrack | null=null):string {
  return biographyBlocks(track).map(block=>{
    let content='';
    if (block.music) {
      const music=block.music;
      content=(block.image ? `<img class="bio-media bio-media-album" src="${escape(block.image.src)}" alt="${escape(block.image.alt)}">` : '')+
        `<span class="bio-music-copy"><span class="bio-music-status"><img class="bio-spotify" src="/manuscript/spotify.svg" alt="Spotify">${music.isPlaying ? playingMarkup : ''}${escape(music.status)}</span><span class="bio-music-song">${escape(music.title)}</span>${music.artist ? `<span class="bio-music-artist">by ${escape(music.artist)}</span>` : ''}</span>`;
    } else {
      content=biographyInline(block).map(part=>{
        const text=escape(part.text);
        if (!part.image && !part.noBreak && !part.accent) return text;
        return `<span class="${part.noBreak ? 'bio-inline ' : ''}${part.accent ? 'bio-word-accent' : ''}">${part.image ? `<img class="bio-media bio-media-${part.image.kind}" src="${escape(part.image.src)}" alt="${escape(part.image.alt)}">` : ''}${text}</span>`;
      }).join('');
    }
    return `<p class="bio-${block.kind}${block.accent ? ' bio-accent' : ''}" style="margin-bottom:${block.gap}px">${content}</p>`;
  }).join('');
}
