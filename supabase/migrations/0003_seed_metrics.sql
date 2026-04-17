-- =====================================================
-- AdPulse — Seed metric definitions
-- =====================================================
insert into public.metric_definitions (key, label, description, unit, channels, is_derived, formula) values
  ('impressions',       'Impressions',         'Total times ads were shown',           'integer',  '{meta,google,tiktok}', false, null),
  ('clicks',            'Clicks',              'Total link clicks',                     'integer',  '{meta,google,tiktok}', false, null),
  ('spend',             'Ad Spend',            'Total amount spent',                    'currency', '{meta,google,tiktok}', false, null),
  ('conversions',       'Conversions',         'Total conversion events',               'integer',  '{meta,google,tiktok}', false, null),
  ('conversions_value', 'Revenue',             'Total value of conversions',            'currency', '{meta,google,tiktok}', false, null),
  ('reach',             'Reach',               'Unique accounts reached',               'integer',  '{meta,tiktok}',        false, null),
  ('video_views',       'Video Views',         'Total video views',                     'integer',  '{meta,tiktok}',        false, null),
  ('roas',              'ROAS',                'Return on ad spend',                    'ratio',    '{meta,google,tiktok}', true,  'conversions_value / spend'),
  ('ctr',               'CTR',                 'Click-through rate',                    'percent',  '{meta,google,tiktok}', true,  'clicks / impressions * 100'),
  ('cpc',               'CPC',                 'Cost per click',                        'currency', '{meta,google,tiktok}', true,  'spend / clicks'),
  ('cpm',               'CPM',                 'Cost per 1000 impressions',             'currency', '{meta,google,tiktok}', true,  'spend / impressions * 1000'),
  ('cvr',               'Conv. Rate',          'Conversion rate from clicks',           'percent',  '{meta,google,tiktok}', true,  'conversions / clicks * 100'),
  ('cpa',               'Cost per Conv.',      'Cost per conversion',                   'currency', '{meta,google,tiktok}', true,  'spend / conversions')
on conflict (key) do update set
  label = excluded.label,
  unit  = excluded.unit;
