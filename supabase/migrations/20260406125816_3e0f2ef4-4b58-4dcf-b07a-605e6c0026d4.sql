
INSERT INTO app_settings (key, value_json) VALUES
-- COLOANE FOOTER
('footer_col1_title', '"Magazin"'),
('footer_col1_links', '"Despre noi:/page/despre-noi|Termeni și condiții:/page/termeni-conditii|Politica de Confidențialitate:/page/politica-confidentialitate|Politica Cookies:/page/politica-cookies|Politica de Retur:/page/politica-retur|Contact:/contact"'),
('footer_col1_show', '"true"'),
('footer_col2_title', '"Clienți"'),
('footer_col2_links', '"Transport și Livrare:/page/livrare|Metode de plată:/page/metode-plata|Garantia Produselor:/page/garantie|Soluționarea online a litigiilor:/page/litigii|ANPC:https://anpc.gov.ro|Harta Site:/harta-site|FAQ:/page/faq"'),
('footer_col2_show', '"true"'),
('footer_col3_title', '"Date comerciale"'),
('footer_col3_show', '"true"'),
('footer_col4_title', '"Suport clienți"'),
('footer_col4_show', '"true"'),
('footer_col4_support_text', '"De Luni până Vineri în intervalul orar 09:00 - 17:00. Timp maxim de răspuns pentru mail 1 zi lucrătoare."'),
-- DATE FIRMĂ
('footer_address_street', '"Str. XXXX Nr. XX"'),
('footer_address_city', '"București"'),
-- CONTACT
('footer_show_contact_btn', '"true"'),
('footer_contact_btn_text', '"Contactează-ne"'),
('footer_contact_btn_url', '"/contact"'),
-- SOCIAL
('footer_social_show', '"true"'),
-- ANPC/SAL logos
('footer_anpc_logo_url', '"https://etamade-com.github.io/anpc-sal-sol-logo/anpc-sal.svg"'),
('footer_anpc_alt', '"Soluționarea Alternativă a Litigiilor"'),
('footer_sal_logo_url', '"https://etamade-com.github.io/anpc-sal-sol-logo/anpc-sol.svg"'),
('footer_sal_alt', '"Soluționarea Online a Litigiilor"'),
-- PAYMENT
('footer_payment_netopia_show', '"true"'),
('footer_payment_visa_show', '"true"'),
('footer_payment_mastercard_show', '"true"'),
('footer_payment_tbi_show', '"false"'),
('footer_payment_ramburs_show', '"true"'),
-- COPYRIGHT
('footer_copyright_year_auto', '"true"'),
('footer_made_in_romania_show', '"false"'),
('footer_made_in_romania_text', '"Made with ❤️ în România"'),
-- COLORS
('footer_bottom_text_color', '"#64748B"'),
('footer_contact_btn_color', '"#0066FF"')
ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json;

-- Update existing keys with new values
UPDATE app_settings SET value_json = '"Mama Lucica SRL"' WHERE key = 'footer_company_name';
UPDATE app_settings SET value_json = '"ROXXXXXXXX"' WHERE key = 'footer_cui';
UPDATE app_settings SET value_json = '"J40/XXXX/2020"' WHERE key = 'footer_reg_com';
UPDATE app_settings SET value_json = '"200 RON"' WHERE key = 'footer_capital_social';
UPDATE app_settings SET value_json = '"true"' WHERE key = 'footer_show_legal_data';
UPDATE app_settings SET value_json = '"+40743326405"' WHERE key = 'footer_phone';
UPDATE app_settings SET value_json = '"contact@mamalucica.ro"' WHERE key = 'footer_email';
UPDATE app_settings SET value_json = '"true"' WHERE key = 'footer_show_phone';
UPDATE app_settings SET value_json = '"true"' WHERE key = 'footer_show_email';
UPDATE app_settings SET value_json = '"true"' WHERE key = 'footer_anpc_show';
UPDATE app_settings SET value_json = '"https://anpc.ro/ce-este-sal/"' WHERE key = 'footer_anpc_url';
UPDATE app_settings SET value_json = '"true"' WHERE key = 'footer_sal_show';
UPDATE app_settings SET value_json = '"https://ec.europa.eu/consumers/odr"' WHERE key = 'footer_sal_url';
UPDATE app_settings SET value_json = '"Mama Lucica SRL"' WHERE key = 'footer_copyright_name';
UPDATE app_settings SET value_json = '"#F1F5F9"' WHERE key = 'footer_bg_color';
UPDATE app_settings SET value_json = '"#475569"' WHERE key = 'footer_text_color';
UPDATE app_settings SET value_json = '"#0F172A"' WHERE key = 'footer_title_color';
UPDATE app_settings SET value_json = '"#475569"' WHERE key = 'footer_link_color';
UPDATE app_settings SET value_json = '"#0066FF"' WHERE key = 'footer_link_hover_color';
UPDATE app_settings SET value_json = '"#E2E8F0"' WHERE key = 'footer_bottom_bg_color';
UPDATE app_settings SET value_json = '"true"' WHERE key = 'footer_show_payment_icons';
UPDATE app_settings SET value_json = '"true"' WHERE key = 'footer_show';
UPDATE app_settings SET value_json = '"Mama Lucica"' WHERE key = 'footer_store_name';
UPDATE app_settings SET value_json = '"Lumânări handmade din ceară naturală, realizate cu pasiune în România."' WHERE key = 'footer_tagline';
