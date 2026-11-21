CREATE TABLE IF NOT EXISTS blueprint_lifecycle (
  lesson_id INTEGER PRIMARY KEY REFERENCES blueprint_lessons(id),
  state TEXT NOT NULL CHECK (state IN ('verified', 'quarantined')),
  origin TEXT NOT NULL,
  verified_at INTEGER
);
CREATE TABLE IF NOT EXISTS blueprint_integrity (
  lesson_id INTEGER PRIMARY KEY REFERENCES blueprint_lessons(id),
  row_sha256 TEXT UNIQUE NOT NULL CHECK(length(row_sha256)=64 AND row_sha256 NOT GLOB '*[^0-9a-f]*'),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
  state INTEGER NOT NULL DEFAULT 1 CHECK(state IN (-1,0,1))
);
CREATE VIEW IF NOT EXISTS blueprint_lessons_v7 AS
SELECT b.id, i.row_sha256, i.version, CASE WHEN l.state='quarantined' THEN 0 ELSE i.state END AS state,
  b.tier, b.domain, b.item_a_label, b.item_b_label, coalesce(b.item_c_label,'N/A — Two-Item Pair') AS item_c_label,
  b.clue_prompt, b.core_parts, b.operations, b.traits_attributes, b.scale_medium, b.input_output, b.flow_direction,
  b.modification_exemption, b.blind_spot_note, coalesce(m.object_key,'N/A — No Diagram') AS r2_diagram_key
FROM blueprint_lessons AS b
JOIN blueprint_integrity AS i ON i.lesson_id=b.id
LEFT JOIN blueprint_lifecycle AS l ON l.lesson_id=b.id
LEFT JOIN blueprint_media AS m ON m.lesson_id=b.id;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 1, 'f0680e89bedb7239c000d6a121352f1e54b23423a4ce41ed7f7891f9410c8c18' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=1)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 2, '1b3112d7577762aec44af8981e181c384f90d7014495394bcda025a16fc435b0' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=2)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 3, 'cdd2c7eebb91093464922e6f5cea8aead01a094b01ab7ea5fb6eb2a4bc70955f' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=3)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 4, '2dacb90efe582a31e7648a311ae33387fcf779b1aa632c23ecbd65e29ea3418e' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=4)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 5, '9d712d37523d9c3cd5124111695aacf7795617f95d931278fde954353f911483' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=5)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 6, 'f4cbabbc82e29f9f7a716788f4546a4bfbe1209ca327b9121858117ec1cb0725' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=6)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 7, '957c09dfa3bf84e0c6ea3ca061a0a2e91ade3b717422ab35267d5ab4b607bf03' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=7)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 8, '0f5d5ff1994baa144508d117b4b3132ec0a7988a21a804f813d51bf11f3b601c' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=8)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 9, '7a2063024537bb09fcfd61aa0c1e07590cb362eece6d79a5d6fb48568a1bfd6b' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=9)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 10, '0f355a05401d0829833a426f1ad1adfb91daea3f7d12e049ad86a3d23d75d671' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=10)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 11, 'a8c39704766469773fa7adda290b5d8479690ce5826a0ee453e51fe533b15ce0' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=11)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 12, 'b7b8a48eea4860a51ca9649c2c504cfed1f5ce7b037305a0a8fabf36d29b2fa3' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=12)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 13, '5899773841b73a9b09467f814ebfe9a69f0572944f02b63e74d92dd79182e9cb' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=13)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 14, '545b97ebd9e4ec76d893a556611ea560924e5e343edf9972a6cd347c01160c2f' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=14)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 15, '94da4e2a306df783329ab44a714dbf0367bdea6bba5fd9ed2212775438d4996d' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=15)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 16, 'bab82b467cd509a2d65565f59b5a0d2fbf61f3be2a42ae911d8045d32b882de1' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=16)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 17, '9f8c4bface6595aa8b97f36c2f02b48c65275eff56e11a8c3b54cfc30bb931d3' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=17)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 18, '0a800f35e7c423e30d6a487293edc4a4b1cbb60a9f5291e5728013de01d2d356' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=18)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 19, 'c26cba3a91c13d1a8512fa4a610f1802ce4a8cd3a2c8ef9372f64aa15aae7b9f' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=19)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 20, 'fe6254fd70b7878225fe81a2ad44594f7cdf6d5d1a61e0c59f3d27481bd69825' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=20)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 21, 'c2e26121e4bf8ddaa49c630ff09d3501c38d9812411e02640650d37c660323e7' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=21)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 22, '78499262a9cb1a391bbb5360fdb63937be4a66f758cf6278a6752cdefcb469f9' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=22)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 23, '6f250ce6d1dd629d4d90299734e9c39f2c56c4ab9337016fd48f1f15e0597246' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=23)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 24, '198a768d5ab7271e1ca926f9a699d139cff3cff62959395cf2f888ca63146d00' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=24)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 25, '991b5e17726c28ebe904a7f6ac095ec93609915db784d38fec088c6633e11047' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=25)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 26, '9e54a212a68db6ad6595844256c45bad1cfab12de01bbc33dfde9c6ae74d5973' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=26)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 27, '5ea6d6ed923d3e031768ea89f54f54794ead45037168d34611b51cd4572cfa46' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=27)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 28, 'd65cf18908e0957fb48c291783fe37b77e2a44c56559fff57ccf5aa17864b6b9' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=28)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 29, '449047b9effdec8bd8002245e8484a1d54d0ddfdeb85f9f4b744887815d37f20' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=29)
ON CONFLICT(lesson_id) DO NOTHING;
INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT 30, '7b59e8d063496bd910db86252b75aac60b89270b8a3b3d2f7c0197a27b48deab' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=30)
ON CONFLICT(lesson_id) DO NOTHING;
