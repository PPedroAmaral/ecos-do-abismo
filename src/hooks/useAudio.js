    // src/hooks/useAudio.js
    import { useRef, useEffect } from 'react';
    import { Howl } from 'howler';

    export const useAudio = () => {
    const bgmRef = useRef(null);

    const playBGM = (area) => {

        if (bgmRef.current && bgmRef.current.playing()) return;

        if (bgmRef.current) {
        bgmRef.current.stop();
        }


        let src = '';
        switch(area) {
        case 'esgotos': src = '/audio/esgotos_bgm.mp3'; break;
        // Adicionaremos mais áreas aqui depois (biblioteca, forja, etc)
        default: return; 
        }

        bgmRef.current = new Howl({
        src: [src],
        loop: true,
        volume: 0.2, 
        });

        bgmRef.current.play();
    };


    const playSFX = (type) => {
        let src = '';

        if (type === 'attack') src = '/audio/sword.mp3';
    
        if (type === 'fogo_fatuo') src = '/audio/fogo_fatuo.mp3';
        if (type === 'cura_menor') src = '/audio/cura_menor.mp3';
        
        if (!src) return;

        const sfx = new Howl({
        src: [src],
        volume: 0.3,
        });

        sfx.play();
    };

    return { playBGM, playSFX };
    };