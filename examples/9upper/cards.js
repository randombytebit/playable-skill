// Card deck for 9UPPER. game.js only plays; this file only stores cards.
// Each card: topic (q/qz), fact (a/az), category (tag/tagz), stars.

export const DECK = [
  {
    q: '8 cm a second', qz: '秒速八厘米', stars: 2, tag: 'Japan food', tagz: '日本食物',
    a: 'Conveyor-belt sushi is usually designed to run at about 8 centimetres a second (some shops sit between 4 and 8), typically clockwise so a right-handed diner can lift a plate with the left hand.',
    az: '迴轉壽司的輸送帶通常設計為每秒約 8 厘米（部分店家約 4 至 8 厘米），多半順時針轉，方便慣用右手的人左手拿盤。',
  },
  {
    q: 'One monme', qz: '一匁', stars: 2, tag: 'Japan', tagz: '日本',
    a: 'A 5-yen coin weighs exactly 3.75 grams — one monme, the old Japanese weight still used to price pearls.',
    az: '5 円硬幣正好重 3.75 克，等於舊制一匁。珍珠交易到現在還用這個單位。',
  },
  {
    q: 'One gō', qz: '一合', stars: 1, tag: 'Japan food', tagz: '日本食物',
    a: 'One gō is about 180 millilitres — the everyday measure for a serving of rice or sake. Ten gō make one shō, the familiar 1.8-litre bottle.',
    az: '一合約 180 毫升，是日常量米或清酒的單位。十合為一升，就是常見的 1.8 公升瓶。',
  },
  {
    q: 'Shakuhachi', qz: '尺八', stars: 2, tag: 'Music', tagz: '音樂',
    a: 'The name is the length: one shaku and eight sun, about 54.5 centimetres. That standard flute is tuned to D.',
    az: '名字就是長度：一尺八角，約 54.5 厘米。這支標準笛的基音是 D。',
  },
  {
    q: 'Hassun', qz: '八寸', stars: 3, tag: 'Japan food', tagz: '日本食物',
    a: 'In kaiseki, the hassun is a tray of seasonal bites named for eight sun — about 24 centimetres across.',
    az: '懷石料理的「八寸」是一盤時令小菜，名字來自八寸，托盤大約 24 厘米寬。',
  },
  {
    q: 'Flea toad', qz: '跳蚤蟾蜍', stars: 3, tag: 'Nature', tagz: '自然',
    a: 'Brachycephalus pulex is a Brazilian frog, not a toad. Adult males average 7.1 millimetres snout to vent — among the smallest known vertebrates.',
    az: '學名 Brachycephalus pulex，其實是蛙不是蟾蜍。雄性吻肛長平均 7.1 毫米，是已知最小的脊椎動物之一。',
  },
  {
    q: 'Golden Record', qz: '金唱片', stars: 2, tag: 'Space', tagz: '太空',
    a: 'Each Voyager carries a 12-inch gold-plated copper disc. The cover marks 3.6 seconds per turn and a speck of uranium-238 as a clock.',
    az: '每艘航海家都帶一片 12 吋鍍金銅唱片。封套標了每轉 3.6 秒，還鍍了一點鈾-238 當時鐘。',
  },
  {
    q: 'Isshōbin', qz: '一升瓶', stars: 1, tag: 'Japan food', tagz: '日本食物',
    a: 'The tall clear sake bottle is one shō: ten gō, labelled 1.8 litres. An izakaya often splits it rather than pouring the whole thing.',
    az: '那種高高的透明清酒瓶是一升：十合，標示 1.8 公升。居酒屋多半分著喝，很少一次倒完。',
  },
  {
    q: 'A4', qz: 'A4', stars: 1, tag: 'Paper', tagz: '紙張',
    a: 'ISO 216 sets A4 at 210 × 297 millimetres. The long side is the short side times √2, so folding it in half keeps the same ratio.',
    az: 'ISO 216 把 A4 定成 210 × 297 毫米。長邊是短邊乘 √2，對折後比例不變。',
  },
  {
    q: 'A440', qz: '標準音高 A', stars: 1, tag: 'Music', tagz: '音樂',
    a: 'Concert pitch A above middle C is 440 hertz, fixed by ISO 16. Orchestras still tune a little sharp or flat around that mark.',
    az: '中央 C 上方的 A 定為 440 赫茲，寫在 ISO 16。樂團實際調音仍會在這附近略高或略低。',
  },
  {
    q: '14 cm banana', qz: '十四厘米蕉', stars: 3, tag: 'Food law', tagz: '食品法規',
    a: 'EU and OECD banana grades ask for at least 14 centimetres along the outer curve and 27 millimetres thick. They ban “abnormal curvature” but never name a bend angle.',
    az: '歐盟與 OECD 的香蕉分級要求沿外側弧長至少 14 厘米、粗至少 27 毫米。規定不能「彎得不正常」，但從沒寫彎幾度。',
  },
  {
    q: 'Genroku Sushi', qz: '元禄寿司', stars: 2, tag: 'Japan food', tagz: '日本食物',
    a: 'Yoshiaki Shiraishi opened the first conveyor-belt sushi shop in Osaka in 1958, after watching beer bottles ride a line at an Asahi brewery.',
    az: '白石義明 1958 年在大阪開了第一家迴轉壽司，靈感來自朝日啤酒廠輸送帶上移動的酒瓶。',
  },
  {
    q: 'One koku', qz: '一石', stars: 3, tag: 'Japan', tagz: '日本',
    a: 'One koku is about 180 litres of rice — historically treated as enough to feed one person for a year, and used to rank a domain’s wealth.',
    az: '一石大約是 180 公升米，舊時當作一個人一年的食量，也用來衡量藩的石高。',
  },
  {
    q: 'One-yen coin', qz: '一圓鋁幣', stars: 1, tag: 'Japan', tagz: '日本',
    a: 'Japan’s 1-yen piece is pure aluminium, 20 millimetres across and exactly 1.00 gram. Set down gently, surface tension can hold it on water.',
    az: '日本 1 円是純鋁，直徑 20 毫米，正好 1.00 克。輕輕放上水面，表面張力可以托住它。',
  },
  {
    q: 'Dickson Fjord', qz: '迪克森峽灣', stars: 3, tag: 'Earth', tagz: '地球',
    a: 'In 2023 a landslide in East Greenland’s Dickson Fjord sent up a tsunami. The water sloshed for about nine days and showed up on seismometers worldwide.',
    az: '2023 年東格陵蘭迪克森峽灣山崩引發海嘯，水來回盪了大約九天，全世界的地震儀都收到訊號。',
  },
  {
    q: '21-centimetre line', qz: '二十一厘米線', stars: 3, tag: 'Space', tagz: '太空',
    a: 'The Voyager cover uses the hydrogen atom’s spin-flip as its time unit — the radio line at a wavelength of 21 centimetres.',
    az: '航海家唱片封套用氫原子自旋翻轉當時間單位，也就是波長 21 厘米的無線電波譜線。',
  },
  {
    q: 'One tsubo', qz: '一坪', stars: 2, tag: 'Japan', tagz: '日本',
    a: 'One tsubo is 400/121 square metres — about 3.31 — a 6-shaku (one ken) square. Listings must use metric; the old unit still turns up as a side note.',
    az: '一坪是 400/121 平方公尺，約 3.31，也就是邊長六尺（一間）的正方形。廣告依法要用公制，舊單位多半只當附註。',
  },
  {
    q: 'One to', qz: '一斗', stars: 1, tag: 'Japan food', tagz: '日本食物',
    a: 'One to is ten shō, about 18.04 litres. The square metal “itto-kan” on a Japanese shelf is labelled 18 litres after that old measure.',
    az: '一斗是十升，約 18.04 公升。貨架上那種方方的「一斗缶」，標的就是依這個單位來的 18 公升。',
  },
  {
    q: 'One kan', qz: '一貫', stars: 2, tag: 'Japan', tagz: '日本',
    a: 'One kan is exactly 3.75 kilograms — one thousand monme. The same old scale that makes a 5-yen coin weigh one monme.',
    az: '一貫正好是 3.75 公斤，等於一千匁。跟 5 円硬幣重一匁，是同一套舊秤。',
  },
  {
    q: 'Yongobin', qz: '四合瓶', stars: 1, tag: 'Japan food', tagz: '日本食物',
    a: 'The everyday sake bottle is four gō: 720 millilitres. Ten gō still fill the tall 1.8-litre isshōbin.',
    az: '日常買的清酒瓶是四合：720 毫升。十合才是那支高高的 1.8 公升一升瓶。',
  },
  {
    q: 'Kujira-jaku', qz: '鯨尺', stars: 3, tag: 'Japan', tagz: '日本',
    a: 'The cloth “whale shaku” is 25/66 of a metre — about 37.9 centimetres, 1.25 times the carpenter’s shaku. Law once allowed that scale for fabric only.',
    az: '量布的「鯨尺」是公尺的 66 分之 25，約 37.9 厘米，是木工曲尺的 1.25 倍。舊法只准用它量織物。',
  },
  {
    q: 'One ri', qz: '一里', stars: 2, tag: 'Japan', tagz: '日本',
    a: 'One Japanese ri is 36 chō — 12,960 shaku, about 3.927 kilometres. Edo highways marked the count with a mound every ri.',
    az: '日本一里是 36 町，等於 12,960 尺，約 3.927 公里。江戶街道每隔一里就堆一座一里塚。',
  },
  {
    q: 'One ken', qz: '一間', stars: 1, tag: 'Japan', tagz: '日本',
    a: 'One ken is six shaku, about 1.818 metres — the bay between pillars. A one-ken square is one tsubo.',
    az: '一間是六尺，約 1.818 公尺，也就是柱與柱之間的開間。邊長一間的正方形就是一坪。',
  },
  {
    q: '633 ml ōbin', qz: '大瓶六百三十三', stars: 3, tag: 'Japan food', tagz: '日本食物',
    a: 'Japan’s large beer bottle is 633 millilitres because 1944 tax rules picked the smallest common size: 3.51 gō (633.168 ml).',
    az: '日本啤酒大瓶是 633 毫升，因為 1944 年稅制選了當時最小的常見容量：3.51 合（633.168 毫升）。',
  },
  {
    q: 'Umami', qz: '旨味', stars: 1, tag: 'Japan food', tagz: '日本食物',
    a: 'In 1908 Kikunae Ikeda isolated glutamate from kombu broth and named the savoury taste umami — later accepted as the fifth basic taste.',
    az: '1908 年池田菊苗從昆布高湯裡分離出麩胺酸鹽，把那股鮮味叫作旨味，後來被認作第五種基本味。',
  },
  {
    q: 'Smoot', qz: '斯穆特', stars: 3, tag: 'Units', tagz: '單位',
    a: 'One smoot is Oliver Smoot’s 1958 height: 5 feet 7 inches. His fraternity measured Harvard Bridge as 364.4 smoots, plus or minus one ear.',
    az: '一斯穆特是奧利佛·斯穆特 1958 年的身高：5 呎 7 吋。社團用他量哈佛橋，得 364.4 斯穆特，加減一隻耳朵。',
  },
  {
    q: 'Le Grand K', qz: '大K', stars: 2, tag: 'Science', tagz: '科學',
    a: 'A 90% platinum, 10% iridium cylinder, about 39 millimetres tall and wide, defined the kilogram until 20 May 2019. Planck’s constant took over.',
    az: '這枚九成鉑、一成銥的圓柱，高與直徑約 39 毫米，到 2019 年 5 月 20 日都是公斤的定義。之後改由普朗克常數接手。',
  },
  {
    q: 'Barn', qz: '靶恩', stars: 3, tag: 'Physics', tagz: '物理',
    a: 'A barn is 10⁻²⁸ square metres — roughly a uranium nucleus as seen by a neutron. Physicists named it in 1942 because that target was “as big as a barn.”',
    az: '一靶恩是 10⁻²⁸ 平方公尺，大約是中子眼裡的鈾原子核。1942 年物理學家取名，因為這靶子「大得像穀倉」。',
  },
  {
    q: '42-gallon barrel', qz: '四十二加侖桶', stars: 2, tag: 'Units', tagz: '單位',
    a: 'A petroleum barrel is 42 US gallons (each 231 cubic inches), the 1872 producers’ standard. A US liquid barrel of other goods is 31.5 gallons.',
    az: '石油桶是 42 美制加侖（每加侖 231 立方吋），1872 年產油公會的標準。美國其他液體的「桶」只有 31.5 加侖。',
  },
  {
    q: 'Caesium second', qz: '銫秒', stars: 2, tag: 'Science', tagz: '科學',
    a: 'The SI second is 9,192,631,770 cycles of caesium-133’s ground-state hyperfine radiation — the number BIPM now fixes exactly.',
    az: '國際秒是銫-133 基態超精細輻射的 9,192,631,770 個週期，這個數字由國際度量衡局定成剛好這麼多。',
  },
  {
    q: 'A0', qz: 'A0', stars: 1, tag: 'Paper', tagz: '紙張',
    a: 'ISO 216 sets A0 at 841 × 1189 millimetres so the sheet is one square metre before millimetre rounding. A4 is that sheet halved four times.',
    az: 'ISO 216 把 A0 定成 841 × 1189 毫米，讓面積在進位成整毫米前剛好一平方公尺。A4 就是它對折四次。',
  },
  {
    q: 'Point Nemo', qz: '尼莫點', stars: 2, tag: 'Earth', tagz: '地球',
    a: 'The oceanic pole of inaccessibility sits about 2,688 kilometres from the nearest land — Ducie, Motu Nui, and Maher Island. The name is Captain Nemo’s.',
    az: '海洋不可及極離最近陸地約 2,688 公里，分別是迪西島、莫圖努伊和馬赫島。名字借自尼莫船長。',
  },
  {
    q: 'Chimborazo', qz: '欽博拉索山', stars: 3, tag: 'Earth', tagz: '地球',
    a: 'This Ecuador peak is only about 6,263 metres above the sea, but Earth’s equatorial bulge puts its summit more than two kilometres farther from the planet’s centre than Everest.',
    az: '這座厄瓜多山海拔只有約 6,263 公尺，可是地球赤道鼓起，讓峰頂離地心比聖母峰還遠兩公里以上。',
  },
  {
    q: 'Kola Superdeep', qz: '科拉超深鑽孔', stars: 3, tag: 'Earth', tagz: '地球',
    a: 'On Russia’s Kola Peninsula, borehole SG-3 reached 12,262 metres in 1989 — still the deepest hole in the crust, and far hotter than the drillers expected.',
    az: '俄羅斯科拉半島的 SG-3 鑽孔在 1989 年鑽到 12,262 公尺，仍是地殼最深的洞，井底也比預期熱得多。',
  },
  {
    q: 'Challenger Deep', qz: '挑戰者深淵', stars: 2, tag: 'Earth', tagz: '地球',
    a: 'A 2020 submersible survey put the Mariana Trench floor at 10,935 metres below sea level, plus or minus 6 metres — the deepest spot yet measured.',
    az: '2020 年潛水器測線把馬里亞納海溝底定在海平面下 10,935 公尺，誤差加減 6 公尺，是目前量到的最深處。',
  },
  {
    q: 'Mauna Kea', qz: '冒納凱亞山', stars: 2, tag: 'Earth', tagz: '地球',
    a: 'The Hawaii volcano stands about 4,205 metres above the sea and another 6,000 metres below it — about 10,211 metres base to peak, taller than Everest.',
    az: '這座夏威夷火山海拔約 4,205 公尺，海面下還有約 6,000 公尺，從山腳到山頂約 10,211 公尺，比聖母峰高。',
  },
  {
    q: 'Pale Blue Dot', qz: '暗淡藍點', stars: 2, tag: 'Space', tagz: '太空',
    a: 'Voyager 1 photographed Earth on 14 February 1990 from about 6 billion kilometres out. In the frame the planet is a 0.12-pixel speck in a sunbeam.',
    az: '航海家一號在 1990 年 2 月 14 日、約 60 億公里外拍下地球。畫面裡它只是陽光裡 0.12 像素的一點。',
  },
  {
    q: 'Scoville', qz: '史高維爾度', stars: 2, tag: 'Food', tagz: '食物',
    a: 'Wilbur Scoville’s 1912 test diluted a chilli extract until a panel could not taste the heat. The dilution factor is the Scoville heat unit.',
    az: '威爾伯·史高維爾 1912 年的測法，是把辣椒萃取液稀釋到評審嚐不出辣為止。那個稀釋倍數就是史高維爾辣度。',
  },
]
