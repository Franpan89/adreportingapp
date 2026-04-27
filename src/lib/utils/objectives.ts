export interface ObjectiveMeta {
  label: string;
  color: string;       // tailwind bg
  textColor: string;   // tailwind text
  convLabel: string;   // what "conversions" means for this objective
  cpaLabel: string;    // what CPA means for this objective
}

const OBJECTIVE_MAP: Record<string, ObjectiveMeta> = {
  // New Meta API objectives
  OUTCOME_SALES:                    { label: 'Ventas',        color: 'bg-[#dcfce7]', textColor: 'text-[#16A34A]', convLabel: 'Compras',         cpaLabel: 'Costo/compra'      },
  OUTCOME_LEADS:                    { label: 'Leads',          color: 'bg-[#dbeafe]', textColor: 'text-[#1D4ED8]', convLabel: 'Leads',           cpaLabel: 'Costo/lead'        },
  OUTCOME_TRAFFIC:                  { label: 'Tráfico',        color: 'bg-[#fef9c3]', textColor: 'text-[#854D0E]', convLabel: 'Clics',           cpaLabel: 'Costo/clic'        },
  OUTCOME_AWARENESS:                { label: 'Reconocimiento', color: 'bg-[#f3e8ff]', textColor: 'text-[#7E22CE]', convLabel: 'Alcance',         cpaLabel: 'CPM'               },
  OUTCOME_ENGAGEMENT:               { label: 'Interacción',    color: 'bg-[#ffedd5]', textColor: 'text-[#C2410C]', convLabel: 'Interacciones',   cpaLabel: 'Costo/inter.'      },
  // OUTCOME_ENGAGEMENT optimizado para mensajería (optimization_goal = CONVERSATIONS / REPLY_MESSAGING)
  OUTCOME_ENGAGEMENT_CONVERSATIONS: { label: 'Mensajes',       color: 'bg-[#cffafe]', textColor: 'text-[#0E7490]', convLabel: 'Conversaciones',  cpaLabel: 'Costo/conversación'},
  OUTCOME_APP_PROMOTION:            { label: 'App',            color: 'bg-[#e0e7ff]', textColor: 'text-[#3730A3]', convLabel: 'Instalaciones',   cpaLabel: 'CPI'               },
  // Legacy Meta objectives
  MESSAGES:             { label: 'Mensajes',       color: 'bg-[#cffafe]', textColor: 'text-[#0E7490]', convLabel: 'Mensajes',     cpaLabel: 'Costo/mensaje'},
  CONVERSIONS:          { label: 'Conversiones',   color: 'bg-[#dcfce7]', textColor: 'text-[#16A34A]', convLabel: 'Compras',      cpaLabel: 'Costo/compra' },
  LEAD_GENERATION:      { label: 'Leads',          color: 'bg-[#dbeafe]', textColor: 'text-[#1D4ED8]', convLabel: 'Leads',        cpaLabel: 'Costo/lead'   },
  TRAFFIC:              { label: 'Tráfico',        color: 'bg-[#fef9c3]', textColor: 'text-[#854D0E]', convLabel: 'Clics',        cpaLabel: 'Costo/clic'   },
  LINK_CLICKS:          { label: 'Tráfico',        color: 'bg-[#fef9c3]', textColor: 'text-[#854D0E]', convLabel: 'Clics',        cpaLabel: 'Costo/clic'   },
  BRAND_AWARENESS:      { label: 'Reconocimiento', color: 'bg-[#f3e8ff]', textColor: 'text-[#7E22CE]', convLabel: 'Alcance',      cpaLabel: 'CPM'          },
  REACH:                { label: 'Alcance',        color: 'bg-[#f3e8ff]', textColor: 'text-[#7E22CE]', convLabel: 'Alcance',      cpaLabel: 'CPM'          },
  VIDEO_VIEWS:          { label: 'Video',          color: 'bg-[#fce7f3]', textColor: 'text-[#9D174D]', convLabel: 'ThruPlays',    cpaLabel: 'Costo/vista'  },
  POST_ENGAGEMENT:      { label: 'Interacción',    color: 'bg-[#ffedd5]', textColor: 'text-[#C2410C]', convLabel: 'Interacciones',cpaLabel: 'Costo/inter.' },
  PAGE_LIKES:           { label: 'Me gustas',      color: 'bg-[#ffedd5]', textColor: 'text-[#C2410C]', convLabel: 'Me gustas',    cpaLabel: 'Costo/me gusta'},
  PRODUCT_CATALOG_SALES:{ label: 'Catálogo',       color: 'bg-[#dcfce7]', textColor: 'text-[#16A34A]', convLabel: 'Compras',      cpaLabel: 'Costo/compra' },
  APP_INSTALLS:         { label: 'App',            color: 'bg-[#e0e7ff]', textColor: 'text-[#3730A3]', convLabel: 'Instalaciones',cpaLabel: 'CPI'          },
  STORE_TRAFFIC:        { label: 'Tienda',         color: 'bg-[#fef9c3]', textColor: 'text-[#854D0E]', convLabel: 'Visitas',      cpaLabel: 'Costo/visita' },
};

const DEFAULT: ObjectiveMeta = {
  label: 'General', color: 'bg-[#F3F4F6]', textColor: 'text-[#6B7280]',
  convLabel: 'Conv.', cpaLabel: 'CPA',
};

export function getObjectiveMeta(objective: string | null | undefined): ObjectiveMeta {
  if (!objective) return DEFAULT;
  return OBJECTIVE_MAP[objective.toUpperCase()] ?? DEFAULT;
}

// Returns which Meta action_type keys count as "conversions" for a given objective
export function getConversionActionTypes(objective: string | null | undefined): string[] {
  const obj = (objective ?? '').toUpperCase();

  if (obj.includes('MESSAGE') || obj.includes('CONVERSATIONS'))
    return ['onsite_conversion.messaging_conversation_started_7d'];

  if (obj.includes('LEAD'))
    return ['lead', 'onsite_conversion.lead_grouped', 'leadgen_grouped'];

  if (obj.includes('VIDEO'))
    return ['video_thruplay_watched_actions'];

  if (obj.includes('APP'))
    return ['mobile_app_install', 'app_install'];

  if (obj.includes('TRAFFIC') || obj.includes('LINK'))
    return ['link_click', 'outbound_click'];

  if (obj.includes('ENGAGEMENT') || obj.includes('PAGE_LIKE') || obj.includes('POST_ENGAGEMENT'))
    return ['post_engagement', 'like', 'comment'];

  // SALES / CONVERSIONS / CATALOG / default
  return ['purchase', 'offsite_conversion.fb_pixel_purchase', 'onsite_web_purchase', 'omni_purchase'];
}

export function getRevenueActionTypes(objective: string | null | undefined): string[] {
  const obj = (objective ?? '').toUpperCase();
  if (obj.includes('SALE') || obj.includes('CONVERSION') || obj.includes('CATALOG'))
    return ['purchase', 'offsite_conversion.fb_pixel_purchase', 'onsite_web_purchase', 'omni_purchase'];
  return [];
}
