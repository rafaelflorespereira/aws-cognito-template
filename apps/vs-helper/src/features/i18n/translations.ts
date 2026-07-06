// Translation dictionaries for the VS Helper.
//
// Keys are shared across every language; `en` is the canonical source. Values
// may contain {named} placeholders, filled in by `translate()` in ./index.

export const SUPPORTED_LANGS = ["en", "pt", "es", "fr", "it"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

// Human-readable, self-referential names for the language picker.
export const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
  fr: "Français",
  it: "Italiano",
};

export type TranslationKey = keyof (typeof translations)["en"];

export const translations = {
  en: {
    "tab.home": "Home",
    "tab.progress": "Progress",
    "tab.leaderboard": "Leaderboard",
    "tab.settings": "Settings",
    "tab.account": "Account",

    "home.title": "Vibrational State",
    "home.cta": "Do the Vibrational State now",

    "next.caption": "Next practice",
    "next.allDone": "All done for today",
    "next.dueNow": "Due now",
    "next.getReady": "Get ready",
    "next.spacing": "~{min} min between sessions",

    "practice.start": "Start",
    "practice.finish": "Finish now",
    "practice.cancel": "Cancel",

    "settings.setupTitle": "Set up your practice",
    "settings.title": "Settings",
    "settings.intro":
      "Choose how many times a day to practice and your daily window. We'll space the reminders evenly through the day.",
    "settings.timesPerDay": "Times per day",
    "settings.firstTime": "First time",
    "settings.lastTime": "Last time",
    "settings.duration": "Session duration",
    "settings.min": "min",
    "settings.sec": "sec",
    "settings.notifications": "Enable notifications",
    "settings.guidedSteps": "Show guided steps",
    "settings.language": "Language",
    "settings.startPracticing": "Start practicing",
    "settings.save": "Save",

    "stats.title": "Progress",
    "stats.today": "today",
    "stats.totalVS": "Total VS",
    "stats.daysActive": "Days active",
    "stats.currentStreak": "Current streak",
    "stats.bestStreak": "Best streak",
    "stats.achievements": "Achievements",

    "account.title": "Account",
    "account.blurb":
      "Sign in to save your progress and sync your sessions across devices. This is optional — the practice works without an account.",
    "account.loginTitle": "Save your progress",
    "account.loginSubtitle":
      "Signing in lets your sessions count across devices (optional).",
    "account.signOut": "Sign out",

    "leaderboard.title": "Leaderboard",
    "leaderboard.intro":
      "Opt in to show your total Vibrational States and streak on the global leaderboard, under a public handle. Reports and personal details never leave your device.",
    "leaderboard.handleLabel": "Public handle",
    "leaderboard.handlePlaceholder": "e.g. energy_seeker",
    "leaderboard.optIn": "Show me on the leaderboard",
    "leaderboard.handleInvalid":
      "Handle must be 3-20 letters, digits, or underscores.",
    "leaderboard.saveFailed": "Couldn't save — please try again.",
    "leaderboard.saving": "Saving...",
    "leaderboard.save": "Save",
    "leaderboard.colRank": "#",
    "leaderboard.colPlayer": "Player",
    "leaderboard.colStreak": "Streak",
    "leaderboard.colTotal": "Total",
    "leaderboard.empty": "No one has joined the leaderboard yet.",
    "leaderboard.signInBlurb":
      "Sign in to join the leaderboard and see how your practice compares.",
    "leaderboard.goToAccount": "Go to Account",

    "report.title": "How was it?",
    "report.chakrasActive": "Chakras felt most active",
    "report.chakrasBlocked": "Chakras felt blocked",
    "report.wellbeing": "Wellbeing after",
    "report.perceptions": "Perceptions",
    "report.notes": "Notes",
    "report.notesPlaceholder": "Anything you noticed (optional)",
    "report.save": "Save report",
    "report.skip": "Skip",

    "chakra.coronochakra": "Crown",
    "chakra.frontochakra": "Brow",
    "chakra.laryngochakra": "Throat",
    "chakra.cardiochakra": "Heart",
    "chakra.umbilicochakra": "Solar plexus",
    "chakra.sexochakra": "Sacral",
    "chakra.basochakra": "Root",
    "chakra.palmar": "Palms",
    "chakra.plantar": "Soles",

    "perception.tingling": "Tingling",
    "perception.warmth": "Warmth",
    "perception.cold": "Cold",
    "perception.pressure": "Pressure",
    "perception.expansion": "Expansion",
    "perception.clairvoyance": "Clairvoyance",
    "perception.sounds": "Sounds",
    "perception.none": "None",

    "maneuver.1.title": "Impulsion",
    "maneuver.1.text":
      "Stand upright with your feet apart and eyes closed. Let your arms hang. Drive the bioenergy flow, by the impulse of your will, from your head down to your hands and feet.",
    "maneuver.2.title": "Sensations",
    "maneuver.2.text":
      "Bring the flow back, by decided will, from your feet up to your head. Notice, through sensations, the direction of the flow from bottom to top.",
    "maneuver.3.title": "Repetition",
    "maneuver.3.text":
      "Repeat the up/down flow about 10 times, feeling the energy sweep through the organs of your body.",
    "maneuver.4.title": "Rhythm",
    "maneuver.4.text":
      "Gradually increase the speed or rhythm of the flow through the force of your determined will.",
    "maneuver.5.title": "Circuits",
    "maneuver.5.text":
      "Expand the intensity of the flow into ever-larger, more powerful circuits, inside and outside the body.",
    "maneuver.6.title": "Installation",
    "maneuver.6.text":
      "Install the vibrational state: the flow and closed circuit dissolve, and your whole energetic field becomes vibrant and alight.",

    "achievement.first-vs.title": "First Spark",
    "achievement.first-vs.desc": "Complete your first Vibrational State.",
    "achievement.ten.title": "Getting Warm",
    "achievement.ten.desc": "Complete 10 Vibrational States.",
    "achievement.century.title": "Century",
    "achievement.century.desc": "Complete 100 Vibrational States.",
    "achievement.streak-3.title": "Momentum",
    "achievement.streak-3.desc": "Meet your daily goal 3 days in a row.",
    "achievement.streak-7.title": "Steady Practice",
    "achievement.streak-7.desc": "Meet your daily goal 7 days in a row.",
    "achievement.days-30.title": "Second Nature",
    "achievement.days-30.desc": "Practice on 30 different days.",

    "notif.title": "Vibrational State",
    "notif.body": "Time for your VS practice.",
  },

  pt: {
    "tab.home": "Início",
    "tab.progress": "Progresso",
    "tab.leaderboard": "Ranking",
    "tab.settings": "Ajustes",
    "tab.account": "Conta",

    "home.title": "Estado Vibracional",
    "home.cta": "Fazer o Estado Vibracional agora",

    "next.caption": "Próxima prática",
    "next.allDone": "Tudo feito por hoje",
    "next.dueNow": "Agora",
    "next.getReady": "Prepare-se",
    "next.spacing": "~{min} min entre sessões",

    "practice.start": "Começar",
    "practice.finish": "Finalizar agora",
    "practice.cancel": "Cancelar",

    "settings.setupTitle": "Configure sua prática",
    "settings.title": "Ajustes",
    "settings.intro":
      "Escolha quantas vezes por dia praticar e a sua janela diária. Vamos distribuir os lembretes de forma uniforme ao longo do dia.",
    "settings.timesPerDay": "Vezes por dia",
    "settings.firstTime": "Primeiro horário",
    "settings.lastTime": "Último horário",
    "settings.duration": "Duração da sessão",
    "settings.min": "min",
    "settings.sec": "seg",
    "settings.notifications": "Ativar notificações",
    "settings.guidedSteps": "Mostrar passos guiados",
    "settings.language": "Idioma",
    "settings.startPracticing": "Começar a praticar",
    "settings.save": "Salvar",

    "stats.title": "Progresso",
    "stats.today": "hoje",
    "stats.totalVS": "Total de EV",
    "stats.daysActive": "Dias ativos",
    "stats.currentStreak": "Sequência atual",
    "stats.bestStreak": "Melhor sequência",
    "stats.achievements": "Conquistas",

    "account.title": "Conta",
    "account.blurb":
      "Entre para salvar seu progresso e sincronizar suas sessões entre dispositivos. Isso é opcional — a prática funciona sem uma conta.",
    "account.loginTitle": "Salve seu progresso",
    "account.loginSubtitle":
      "Entrar permite que suas sessões contem em vários dispositivos (opcional).",
    "account.signOut": "Sair",

    "leaderboard.title": "Ranking",
    "leaderboard.intro":
      "Participe para mostrar seu total de Estados Vibracionais e sua sequência no ranking global, sob um nome público. Relatos e dados pessoais nunca saem do seu dispositivo.",
    "leaderboard.handleLabel": "Nome público",
    "leaderboard.handlePlaceholder": "ex.: buscador_energia",
    "leaderboard.optIn": "Mostrar-me no ranking",
    "leaderboard.handleInvalid":
      "O nome deve ter 3-20 letras, números ou underscores.",
    "leaderboard.saveFailed": "Não foi possível salvar — tente novamente.",
    "leaderboard.saving": "Salvando...",
    "leaderboard.save": "Salvar",
    "leaderboard.colRank": "#",
    "leaderboard.colPlayer": "Jogador",
    "leaderboard.colStreak": "Sequência",
    "leaderboard.colTotal": "Total",
    "leaderboard.empty": "Ninguém entrou no ranking ainda.",
    "leaderboard.signInBlurb":
      "Entre para participar do ranking e ver como sua prática se compara.",
    "leaderboard.goToAccount": "Ir para Conta",

    "report.title": "Como foi?",
    "report.chakrasActive": "Chacras mais ativos",
    "report.chakrasBlocked": "Chacras bloqueados",
    "report.wellbeing": "Bem-estar depois",
    "report.perceptions": "Percepções",
    "report.notes": "Notas",
    "report.notesPlaceholder": "Algo que você percebeu (opcional)",
    "report.save": "Salvar relato",
    "report.skip": "Pular",

    "chakra.coronochakra": "Coronário",
    "chakra.frontochakra": "Frontal",
    "chakra.laryngochakra": "Laríngeo",
    "chakra.cardiochakra": "Cardíaco",
    "chakra.umbilicochakra": "Plexo solar",
    "chakra.sexochakra": "Sacral",
    "chakra.basochakra": "Básico",
    "chakra.palmar": "Palmas",
    "chakra.plantar": "Plantas",

    "perception.tingling": "Formigamento",
    "perception.warmth": "Calor",
    "perception.cold": "Frio",
    "perception.pressure": "Pressão",
    "perception.expansion": "Expansão",
    "perception.clairvoyance": "Clarividência",
    "perception.sounds": "Sons",
    "perception.none": "Nenhuma",

    "maneuver.1.title": "Impulsão",
    "maneuver.1.text":
      "Fique em pé com os pés afastados e os olhos fechados. Deixe os braços soltos. Impulsione o fluxo bioenergético, pelo impulso da vontade, da cabeça até as mãos e os pés.",
    "maneuver.2.title": "Sensações",
    "maneuver.2.text":
      "Traga o fluxo de volta, por vontade decidida, dos pés até a cabeça. Perceba, pelas sensações, a direção do fluxo de baixo para cima.",
    "maneuver.3.title": "Repetição",
    "maneuver.3.text":
      "Repita o fluxo para cima e para baixo cerca de 10 vezes, sentindo a energia percorrer os órgãos do corpo.",
    "maneuver.4.title": "Ritmo",
    "maneuver.4.text":
      "Aumente gradualmente a velocidade ou o ritmo do fluxo pela força da sua vontade determinada.",
    "maneuver.5.title": "Circuitos",
    "maneuver.5.text":
      "Expanda a intensidade do fluxo em circuitos cada vez maiores e mais potentes, dentro e fora do corpo.",
    "maneuver.6.title": "Instalação",
    "maneuver.6.text":
      "Instale o estado vibracional: o fluxo e o circuito fechado se dissolvem, e todo o seu campo energético fica vibrante e aceso.",

    "achievement.first-vs.title": "Primeira Faísca",
    "achievement.first-vs.desc": "Complete seu primeiro Estado Vibracional.",
    "achievement.ten.title": "Esquentando",
    "achievement.ten.desc": "Complete 10 Estados Vibracionais.",
    "achievement.century.title": "Centena",
    "achievement.century.desc": "Complete 100 Estados Vibracionais.",
    "achievement.streak-3.title": "Impulso",
    "achievement.streak-3.desc": "Atinja sua meta diária 3 dias seguidos.",
    "achievement.streak-7.title": "Prática Constante",
    "achievement.streak-7.desc": "Atinja sua meta diária 7 dias seguidos.",
    "achievement.days-30.title": "Segunda Natureza",
    "achievement.days-30.desc": "Pratique em 30 dias diferentes.",

    "notif.title": "Estado Vibracional",
    "notif.body": "Hora da sua prática do EV.",
  },

  es: {
    "tab.home": "Inicio",
    "tab.progress": "Progreso",
    "tab.leaderboard": "Clasificación",
    "tab.settings": "Ajustes",
    "tab.account": "Cuenta",

    "home.title": "Estado Vibracional",
    "home.cta": "Hacer el Estado Vibracional ahora",

    "next.caption": "Próxima práctica",
    "next.allDone": "Todo listo por hoy",
    "next.dueNow": "Ahora",
    "next.getReady": "Prepárate",
    "next.spacing": "~{min} min entre sesiones",

    "practice.start": "Empezar",
    "practice.finish": "Finalizar ahora",
    "practice.cancel": "Cancelar",

    "settings.setupTitle": "Configura tu práctica",
    "settings.title": "Ajustes",
    "settings.intro":
      "Elige cuántas veces al día practicar y tu franja diaria. Espaciaremos los recordatorios de forma uniforme durante el día.",
    "settings.timesPerDay": "Veces por día",
    "settings.firstTime": "Primera hora",
    "settings.lastTime": "Última hora",
    "settings.duration": "Duración de la sesión",
    "settings.min": "min",
    "settings.sec": "seg",
    "settings.notifications": "Activar notificaciones",
    "settings.guidedSteps": "Mostrar pasos guiados",
    "settings.language": "Idioma",
    "settings.startPracticing": "Empezar a practicar",
    "settings.save": "Guardar",

    "stats.title": "Progreso",
    "stats.today": "hoy",
    "stats.totalVS": "Total de EV",
    "stats.daysActive": "Días activos",
    "stats.currentStreak": "Racha actual",
    "stats.bestStreak": "Mejor racha",
    "stats.achievements": "Logros",

    "account.title": "Cuenta",
    "account.blurb":
      "Inicia sesión para guardar tu progreso y sincronizar tus sesiones entre dispositivos. Es opcional: la práctica funciona sin una cuenta.",
    "account.loginTitle": "Guarda tu progreso",
    "account.loginSubtitle":
      "Iniciar sesión permite que tus sesiones cuenten en varios dispositivos (opcional).",
    "account.signOut": "Cerrar sesión",

    "leaderboard.title": "Clasificación",
    "leaderboard.intro":
      "Únete para mostrar tu total de Estados Vibracionales y tu racha en la clasificación global, bajo un nombre público. Los informes y datos personales nunca salen de tu dispositivo.",
    "leaderboard.handleLabel": "Nombre público",
    "leaderboard.handlePlaceholder": "ej.: buscador_energia",
    "leaderboard.optIn": "Mostrarme en la clasificación",
    "leaderboard.handleInvalid":
      "El nombre debe tener 3-20 letras, números o guiones bajos.",
    "leaderboard.saveFailed": "No se pudo guardar — inténtalo de nuevo.",
    "leaderboard.saving": "Guardando...",
    "leaderboard.save": "Guardar",
    "leaderboard.colRank": "#",
    "leaderboard.colPlayer": "Jugador",
    "leaderboard.colStreak": "Racha",
    "leaderboard.colTotal": "Total",
    "leaderboard.empty": "Todavía nadie se ha unido a la clasificación.",
    "leaderboard.signInBlurb":
      "Inicia sesión para unirte a la clasificación y ver cómo se compara tu práctica.",
    "leaderboard.goToAccount": "Ir a Cuenta",

    "report.title": "¿Cómo estuvo?",
    "report.chakrasActive": "Chakras más activos",
    "report.chakrasBlocked": "Chakras bloqueados",
    "report.wellbeing": "Bienestar después",
    "report.perceptions": "Percepciones",
    "report.notes": "Notas",
    "report.notesPlaceholder": "Algo que notaste (opcional)",
    "report.save": "Guardar informe",
    "report.skip": "Omitir",

    "chakra.coronochakra": "Corona",
    "chakra.frontochakra": "Frente",
    "chakra.laryngochakra": "Garganta",
    "chakra.cardiochakra": "Corazón",
    "chakra.umbilicochakra": "Plexo solar",
    "chakra.sexochakra": "Sacro",
    "chakra.basochakra": "Raíz",
    "chakra.palmar": "Palmas",
    "chakra.plantar": "Plantas",

    "perception.tingling": "Hormigueo",
    "perception.warmth": "Calor",
    "perception.cold": "Frío",
    "perception.pressure": "Presión",
    "perception.expansion": "Expansión",
    "perception.clairvoyance": "Clarividencia",
    "perception.sounds": "Sonidos",
    "perception.none": "Ninguna",

    "maneuver.1.title": "Impulsión",
    "maneuver.1.text":
      "Ponte de pie con los pies separados y los ojos cerrados. Deja caer los brazos. Impulsa el flujo bioenergético, por el impulso de tu voluntad, desde la cabeza hasta las manos y los pies.",
    "maneuver.2.title": "Sensaciones",
    "maneuver.2.text":
      "Devuelve el flujo, con voluntad decidida, desde los pies hasta la cabeza. Nota, a través de las sensaciones, la dirección del flujo de abajo hacia arriba.",
    "maneuver.3.title": "Repetición",
    "maneuver.3.text":
      "Repite el flujo hacia arriba y hacia abajo unas 10 veces, sintiendo la energía recorrer los órganos de tu cuerpo.",
    "maneuver.4.title": "Ritmo",
    "maneuver.4.text":
      "Aumenta gradualmente la velocidad o el ritmo del flujo por la fuerza de tu voluntad determinada.",
    "maneuver.5.title": "Circuitos",
    "maneuver.5.text":
      "Expande la intensidad del flujo en circuitos cada vez más grandes y potentes, dentro y fuera del cuerpo.",
    "maneuver.6.title": "Instalación",
    "maneuver.6.text":
      "Instala el estado vibracional: el flujo y el circuito cerrado se disuelven, y todo tu campo energético se vuelve vibrante y encendido.",

    "achievement.first-vs.title": "Primera Chispa",
    "achievement.first-vs.desc": "Completa tu primer Estado Vibracional.",
    "achievement.ten.title": "Entrando en Calor",
    "achievement.ten.desc": "Completa 10 Estados Vibracionales.",
    "achievement.century.title": "Centena",
    "achievement.century.desc": "Completa 100 Estados Vibracionales.",
    "achievement.streak-3.title": "Impulso",
    "achievement.streak-3.desc": "Cumple tu meta diaria 3 días seguidos.",
    "achievement.streak-7.title": "Práctica Constante",
    "achievement.streak-7.desc": "Cumple tu meta diaria 7 días seguidos.",
    "achievement.days-30.title": "Segunda Naturaleza",
    "achievement.days-30.desc": "Practica en 30 días diferentes.",

    "notif.title": "Estado Vibracional",
    "notif.body": "Hora de tu práctica del EV.",
  },

  fr: {
    "tab.home": "Accueil",
    "tab.progress": "Progrès",
    "tab.leaderboard": "Classement",
    "tab.settings": "Réglages",
    "tab.account": "Compte",

    "home.title": "État Vibratoire",
    "home.cta": "Faire l'État Vibratoire maintenant",

    "next.caption": "Prochaine pratique",
    "next.allDone": "Tout est fait pour aujourd'hui",
    "next.dueNow": "Maintenant",
    "next.getReady": "Préparez-vous",
    "next.spacing": "~{min} min entre les séances",

    "practice.start": "Commencer",
    "practice.finish": "Terminer maintenant",
    "practice.cancel": "Annuler",

    "settings.setupTitle": "Configurez votre pratique",
    "settings.title": "Réglages",
    "settings.intro":
      "Choisissez combien de fois par jour pratiquer et votre plage horaire. Nous répartirons les rappels uniformément dans la journée.",
    "settings.timesPerDay": "Fois par jour",
    "settings.firstTime": "Première heure",
    "settings.lastTime": "Dernière heure",
    "settings.duration": "Durée de la séance",
    "settings.min": "min",
    "settings.sec": "sec",
    "settings.notifications": "Activer les notifications",
    "settings.guidedSteps": "Afficher les étapes guidées",
    "settings.language": "Langue",
    "settings.startPracticing": "Commencer à pratiquer",
    "settings.save": "Enregistrer",

    "stats.title": "Progrès",
    "stats.today": "aujourd'hui",
    "stats.totalVS": "Total d'EV",
    "stats.daysActive": "Jours actifs",
    "stats.currentStreak": "Série actuelle",
    "stats.bestStreak": "Meilleure série",
    "stats.achievements": "Réussites",

    "account.title": "Compte",
    "account.blurb":
      "Connectez-vous pour enregistrer votre progression et synchroniser vos séances entre appareils. C'est facultatif — la pratique fonctionne sans compte.",
    "account.loginTitle": "Enregistrez votre progression",
    "account.loginSubtitle":
      "Se connecter permet à vos séances de compter sur plusieurs appareils (facultatif).",
    "account.signOut": "Se déconnecter",

    "leaderboard.title": "Classement",
    "leaderboard.intro":
      "Participez pour afficher votre total d'États Vibratoires et votre série dans le classement mondial, sous un pseudo public. Les comptes rendus et données personnelles ne quittent jamais votre appareil.",
    "leaderboard.handleLabel": "Pseudo public",
    "leaderboard.handlePlaceholder": "ex. : chercheur_energie",
    "leaderboard.optIn": "M'afficher dans le classement",
    "leaderboard.handleInvalid":
      "Le pseudo doit comporter 3 à 20 lettres, chiffres ou underscores.",
    "leaderboard.saveFailed": "Échec de l'enregistrement — réessayez.",
    "leaderboard.saving": "Enregistrement...",
    "leaderboard.save": "Enregistrer",
    "leaderboard.colRank": "#",
    "leaderboard.colPlayer": "Joueur",
    "leaderboard.colStreak": "Série",
    "leaderboard.colTotal": "Total",
    "leaderboard.empty": "Personne n'a encore rejoint le classement.",
    "leaderboard.signInBlurb":
      "Connectez-vous pour rejoindre le classement et comparer votre pratique.",
    "leaderboard.goToAccount": "Aller au Compte",

    "report.title": "Comment c'était ?",
    "report.chakrasActive": "Chakras les plus actifs",
    "report.chakrasBlocked": "Chakras bloqués",
    "report.wellbeing": "Bien-être après",
    "report.perceptions": "Perceptions",
    "report.notes": "Notes",
    "report.notesPlaceholder": "Ce que vous avez remarqué (facultatif)",
    "report.save": "Enregistrer le compte rendu",
    "report.skip": "Ignorer",

    "chakra.coronochakra": "Couronne",
    "chakra.frontochakra": "Front",
    "chakra.laryngochakra": "Gorge",
    "chakra.cardiochakra": "Cœur",
    "chakra.umbilicochakra": "Plexus solaire",
    "chakra.sexochakra": "Sacré",
    "chakra.basochakra": "Racine",
    "chakra.palmar": "Paumes",
    "chakra.plantar": "Plantes",

    "perception.tingling": "Picotement",
    "perception.warmth": "Chaleur",
    "perception.cold": "Froid",
    "perception.pressure": "Pression",
    "perception.expansion": "Expansion",
    "perception.clairvoyance": "Clairvoyance",
    "perception.sounds": "Sons",
    "perception.none": "Aucune",

    "maneuver.1.title": "Impulsion",
    "maneuver.1.text":
      "Tenez-vous droit, les pieds écartés et les yeux fermés. Laissez pendre vos bras. Poussez le flux bioénergétique, par l'impulsion de votre volonté, de la tête vers les mains et les pieds.",
    "maneuver.2.title": "Sensations",
    "maneuver.2.text":
      "Ramenez le flux, par une volonté décidée, des pieds vers la tête. Remarquez, par les sensations, la direction du flux de bas en haut.",
    "maneuver.3.title": "Répétition",
    "maneuver.3.text":
      "Répétez le flux de haut en bas environ 10 fois, en sentant l'énergie parcourir les organes de votre corps.",
    "maneuver.4.title": "Rythme",
    "maneuver.4.text":
      "Augmentez progressivement la vitesse ou le rythme du flux par la force de votre volonté déterminée.",
    "maneuver.5.title": "Circuits",
    "maneuver.5.text":
      "Étendez l'intensité du flux en circuits toujours plus grands et puissants, à l'intérieur et à l'extérieur du corps.",
    "maneuver.6.title": "Installation",
    "maneuver.6.text":
      "Installez l'état vibratoire : le flux et le circuit fermé se dissolvent, et tout votre champ énergétique devient vibrant et illuminé.",

    "achievement.first-vs.title": "Première Étincelle",
    "achievement.first-vs.desc": "Complétez votre premier État Vibratoire.",
    "achievement.ten.title": "Ça s'échauffe",
    "achievement.ten.desc": "Complétez 10 États Vibratoires.",
    "achievement.century.title": "Centaine",
    "achievement.century.desc": "Complétez 100 États Vibratoires.",
    "achievement.streak-3.title": "Élan",
    "achievement.streak-3.desc":
      "Atteignez votre objectif quotidien 3 jours de suite.",
    "achievement.streak-7.title": "Pratique Régulière",
    "achievement.streak-7.desc":
      "Atteignez votre objectif quotidien 7 jours de suite.",
    "achievement.days-30.title": "Seconde Nature",
    "achievement.days-30.desc": "Pratiquez sur 30 jours différents.",

    "notif.title": "État Vibratoire",
    "notif.body": "C'est l'heure de votre pratique de l'EV.",
  },

  it: {
    "tab.home": "Home",
    "tab.progress": "Progressi",
    "tab.leaderboard": "Classifica",
    "tab.settings": "Impostazioni",
    "tab.account": "Account",

    "home.title": "Stato Vibrazionale",
    "home.cta": "Fai lo Stato Vibrazionale ora",

    "next.caption": "Prossima pratica",
    "next.allDone": "Tutto fatto per oggi",
    "next.dueNow": "Adesso",
    "next.getReady": "Preparati",
    "next.spacing": "~{min} min tra le sessioni",

    "practice.start": "Inizia",
    "practice.finish": "Termina ora",
    "practice.cancel": "Annulla",

    "settings.setupTitle": "Configura la tua pratica",
    "settings.title": "Impostazioni",
    "settings.intro":
      "Scegli quante volte al giorno praticare e la tua fascia oraria. Distribuiremo i promemoria in modo uniforme durante la giornata.",
    "settings.timesPerDay": "Volte al giorno",
    "settings.firstTime": "Primo orario",
    "settings.lastTime": "Ultimo orario",
    "settings.duration": "Durata della sessione",
    "settings.min": "min",
    "settings.sec": "sec",
    "settings.notifications": "Attiva le notifiche",
    "settings.guidedSteps": "Mostra i passaggi guidati",
    "settings.language": "Lingua",
    "settings.startPracticing": "Inizia a praticare",
    "settings.save": "Salva",

    "stats.title": "Progressi",
    "stats.today": "oggi",
    "stats.totalVS": "Totale SV",
    "stats.daysActive": "Giorni attivi",
    "stats.currentStreak": "Serie attuale",
    "stats.bestStreak": "Serie migliore",
    "stats.achievements": "Traguardi",

    "account.title": "Account",
    "account.blurb":
      "Accedi per salvare i tuoi progressi e sincronizzare le tue sessioni tra i dispositivi. È facoltativo — la pratica funziona senza un account.",
    "account.loginTitle": "Salva i tuoi progressi",
    "account.loginSubtitle":
      "Accedendo, le tue sessioni contano su più dispositivi (facoltativo).",
    "account.signOut": "Esci",

    "leaderboard.title": "Classifica",
    "leaderboard.intro":
      "Partecipa per mostrare il tuo totale di Stati Vibrazionali e la tua serie nella classifica globale, con un nome pubblico. Resoconti e dati personali non lasciano mai il tuo dispositivo.",
    "leaderboard.handleLabel": "Nome pubblico",
    "leaderboard.handlePlaceholder": "es.: cercatore_energia",
    "leaderboard.optIn": "Mostrami nella classifica",
    "leaderboard.handleInvalid":
      "Il nome deve avere 3-20 lettere, numeri o underscore.",
    "leaderboard.saveFailed": "Salvataggio non riuscito — riprova.",
    "leaderboard.saving": "Salvataggio...",
    "leaderboard.save": "Salva",
    "leaderboard.colRank": "#",
    "leaderboard.colPlayer": "Giocatore",
    "leaderboard.colStreak": "Serie",
    "leaderboard.colTotal": "Totale",
    "leaderboard.empty": "Nessuno si è ancora unito alla classifica.",
    "leaderboard.signInBlurb":
      "Accedi per unirti alla classifica e vedere come si confronta la tua pratica.",
    "leaderboard.goToAccount": "Vai ad Account",

    "report.title": "Com'è andata?",
    "report.chakrasActive": "Chakra più attivi",
    "report.chakrasBlocked": "Chakra bloccati",
    "report.wellbeing": "Benessere dopo",
    "report.perceptions": "Percezioni",
    "report.notes": "Note",
    "report.notesPlaceholder": "Qualcosa che hai notato (facoltativo)",
    "report.save": "Salva il resoconto",
    "report.skip": "Salta",

    "chakra.coronochakra": "Corona",
    "chakra.frontochakra": "Fronte",
    "chakra.laryngochakra": "Gola",
    "chakra.cardiochakra": "Cuore",
    "chakra.umbilicochakra": "Plesso solare",
    "chakra.sexochakra": "Sacrale",
    "chakra.basochakra": "Radice",
    "chakra.palmar": "Palmi",
    "chakra.plantar": "Piante",

    "perception.tingling": "Formicolio",
    "perception.warmth": "Calore",
    "perception.cold": "Freddo",
    "perception.pressure": "Pressione",
    "perception.expansion": "Espansione",
    "perception.clairvoyance": "Chiaroveggenza",
    "perception.sounds": "Suoni",
    "perception.none": "Nessuna",

    "maneuver.1.title": "Impulso",
    "maneuver.1.text":
      "Stai in piedi con i piedi divaricati e gli occhi chiusi. Lascia pendere le braccia. Spingi il flusso bioenergetico, per impulso della volontà, dalla testa fino alle mani e ai piedi.",
    "maneuver.2.title": "Sensazioni",
    "maneuver.2.text":
      "Riporta il flusso, con volontà decisa, dai piedi fino alla testa. Nota, attraverso le sensazioni, la direzione del flusso dal basso verso l'alto.",
    "maneuver.3.title": "Ripetizione",
    "maneuver.3.text":
      "Ripeti il flusso su e giù circa 10 volte, sentendo l'energia attraversare gli organi del corpo.",
    "maneuver.4.title": "Ritmo",
    "maneuver.4.text":
      "Aumenta gradualmente la velocità o il ritmo del flusso con la forza della tua volontà determinata.",
    "maneuver.5.title": "Circuiti",
    "maneuver.5.text":
      "Espandi l'intensità del flusso in circuiti sempre più ampi e potenti, dentro e fuori dal corpo.",
    "maneuver.6.title": "Installazione",
    "maneuver.6.text":
      "Installa lo stato vibrazionale: il flusso e il circuito chiuso si dissolvono, e tutto il tuo campo energetico diventa vibrante e acceso.",

    "achievement.first-vs.title": "Prima Scintilla",
    "achievement.first-vs.desc": "Completa il tuo primo Stato Vibrazionale.",
    "achievement.ten.title": "Ci Siamo Scaldando",
    "achievement.ten.desc": "Completa 10 Stati Vibrazionali.",
    "achievement.century.title": "Centinaio",
    "achievement.century.desc": "Completa 100 Stati Vibrazionali.",
    "achievement.streak-3.title": "Slancio",
    "achievement.streak-3.desc":
      "Raggiungi il tuo obiettivo giornaliero per 3 giorni di fila.",
    "achievement.streak-7.title": "Pratica Costante",
    "achievement.streak-7.desc":
      "Raggiungi il tuo obiettivo giornaliero per 7 giorni di fila.",
    "achievement.days-30.title": "Seconda Natura",
    "achievement.days-30.desc": "Pratica in 30 giorni diversi.",

    "notif.title": "Stato Vibrazionale",
    "notif.body": "È l'ora della tua pratica dello SV.",
  },
} as const;
