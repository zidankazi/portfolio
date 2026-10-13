import type {Track} from './spotify.ts';

export type BioTrack = Pick<Track,'title' | 'artist' | 'isPlaying' | 'albumArt'>;
export type BioImage = {src:string; alt:string; kind:'league' | 'cs2' | 'album'};
export type BioBlock = {kind:'name' | 'body' | 'label' | 'hobby' | 'song' | 'artist' | 'cue'; text:string; gap:number; accent?:boolean; image?:BioImage};

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
    {kind:'hobby',text:'I play League of Legends. I used to be Challenger (top 300 out of 3,000,000).',gap:12,accent:true,image:{src:'/manuscript/league.png',alt:'League of Legends logo',kind:'league'}},
    {kind:'hobby',text:'I also collect CS2 skins. Right now I have a FN Damascus Steel Karambit and MW Snow Leopards.',gap:24,image:{src:'/manuscript/cs2.jpg',alt:'Counter-Strike 2 logo',kind:'cs2'}},
    {kind:'body',text:'I listen to a lot of music, too.',gap:12},
    ...(track?.title ? [
      {kind:'label' as const,text:track.isPlaying ? "♪ Right now I'm listening to" : '♪ I last listened to',gap:6},
      {kind:'song' as const,text:track.title,gap:track.artist ? 0 : 24,...(album ? {image:{src:album,alt:track.title+' album cover',kind:'album' as const}} : {})},
      ...(track.artist ? [{kind:'artist' as const,text:'by '+track.artist,gap:24}] : []),
    ] : []),
    {kind:'cue',text:'A few things I’ve built ↓',gap:0},
  ];
}

// Keep artwork and the words it describes together in both canvas and fallback.
export function biographyInline(block:BioBlock):{text:string;image?:BioImage}[] {
  if (!block.image) return [{text:block.text}];
  const phrase=block.image.kind==='league' ? 'League of Legends' : block.image.kind==='cs2' ? 'CS2 skins' : block.text.split(/\s+/)[0];
  const start=block.text.indexOf(phrase);
  return [
    ...(start>0 ? [{text:block.text.slice(0,start)}] : []),
    {text:phrase,image:block.image},
    ...(start+phrase.length<block.text.length ? [{text:block.text.slice(start+phrase.length)}] : []),
  ];
}
