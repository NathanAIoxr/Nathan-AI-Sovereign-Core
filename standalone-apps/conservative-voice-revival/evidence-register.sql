-- November 2026 recovery dossier: evidence, contradictions and missing original records.
CREATE TABLE IF NOT EXISTS evidence_claims (
 id INTEGER PRIMARY KEY,
 statement TEXT NOT NULL,
 evidence_status TEXT NOT NULL,
 basis TEXT NOT NULL,
 document_name TEXT NOT NULL DEFAULT 'TheConservativeVoice.com Historical Dossier 2026-11-05'
);
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(1,'Site founded by Nathan Tabor in 2004','confirmed_contemporary_profile','CBN/Regent');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(2,'XOOPS and NewBB modules in 2004','confirmed_archived_source','TCV-A001 to TCV-A009');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(3,'phpList 2.8.8 in 2004','confirmed_archived_source','TCV-A007');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(4,'Early 2005/08 Lasso version','unknown','Only .lasso route names');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(5,'All server-side PHP and Lasso source recovered','not_recovered','Public rendered HTML only');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(6,'300000+ newsletter addresses','contemporary_first_person_quote','CBN profile; not all delivered emails');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(7,'90000 confirmed daily-update recipients in 2007','site_published_claim','TCV-A026; not mailing log');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(8,'250000 automated emails sent daily','user_account_not_independently_verified','No original send logs');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(9,'Cron schedule and exact batch sizes','invented_by_prior_assistant','No original logs/config');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(10,'is_pending_blast database flag','invented_by_prior_assistant','No SQL schema');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(11,'Specific SMTP/MTA product','unknown','No configuration');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(12,'Google #1 for conservative query','user_account_unverified','No dated rankings recovered');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(13,'Competitor spent $50000 monthly SEO','user_account_unverified','No budget documents');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(14,'Twelve to one robots Disallow lines','confirmed_archived_source','TCV-A002 vs TCV-A013');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(15,'Site was zero JavaScript','contradicted_by_archived_source','Scripts on 2004-08 pages');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(16,'Server returned content in milliseconds','unverified_performance','No timing logs');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(17,'Every directory was public','contradicted','2004 restricted downloads; later /cgi-bin excluded');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(18,'Multiple servers and redundant North Carolina fiber','site_published_claim','TCV-A026');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(19,'Custom BIND, split DNS, IPTables protections','speculative_prior_assistant_claim','No zone/config/logs recovered');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(20,'2008 Aug 15 customer-list acquisition $152000','confirmed_sec_filing','Salem Form 10-K');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(21,'2008 transfer included all source code','unknown','Purchase agreement unavailable');
INSERT OR REPLACE INTO evidence_claims(id,statement,evidence_status,basis) VALUES(22,'Post acquisition Townhall ASP.NET YUI','confirmed_archived_source','TCV-A037');
