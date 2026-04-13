UPDATE app_settings 
SET value_json = to_jsonb('Despre noi:/page/despre-noi|Termeni și condiții:/page/termeni-conditii|Politica de Confidențialitate:/page/politica-de-confidentialitate|Politica Cookies:/page/politica-cookie|Politica de Retur:/page/politica-retur|Contact:/contact'::text),
    updated_at = now()
WHERE key = 'footer_col1_links';