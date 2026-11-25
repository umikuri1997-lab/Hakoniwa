'use strict';
/* 土のステージ：粘土とやきもの（tsuchi.js のつづき。村のわき役。IDEAS.md の「村のわき役」）
   ・粘土（nendo）：谷の岩をせいれいがほると、砂岩（TSSAGAN）といっしょに TSNENDO こ出る（spirit-act.js の mine）
   ・粘土の窯（tskama）：粘土3こで、やきもの（yaki）1こ（proc.js の PROC。はたおり機・粉ひき小屋と同じ作り。土のせいれいが焼く）
   ・やきもの（yaki）でつくる物：つぼ（tsubo。住み心地+6）
   ・かわら・土の壁は、まだ作っていない（IDEAS.md）
   絵はコードの仮の絵（tsuchi.js の tsDrawObj）。たしかめは tools/tests/tsuchi-yaki.cjs */
const TSNENDO=1/* 岩をほると出る粘土 */;
TSIDS.add('tskama');TSIDS.add('tsubo');
