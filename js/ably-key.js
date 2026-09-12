/* =========================================================
   Chiave Ably (servizio realtime) — usata SOLO da Glow Hockey
   per il collegamento a bassa latenza. È una chiave limitata
   (publish/subscribe/presence) sul piano gratuito: se manca o
   non funziona, l'hockey torna da solo sul collegamento MQTT.
   NB: è visibile perché il codice è pubblico; è una scelta voluta.
   ========================================================= */
window.SG_ABLY_KEY = "D0TUSg.cGAqaw:N7kk1E8XhKVWkyHpEdGNQ2RnTqb28UjH3iyvsAaB-HY";
