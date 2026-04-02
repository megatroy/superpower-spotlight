// Maps first names (lowercase) to team context for personalized horoscopes.
// When a player's name matches, their horoscope can reference real projects, risks, and teammates.

const TEAM_DATA = {
  // === Curriculum Sync ===
  esther: {
    team: "Curriculum Sync",
    role: "Product Manager",
    projects: ["IM360 on Google Classroom for Boston Public Schools", "Canvas Pilot iterations", "IM360 Slides production", "GClassroom Loader build"],
    risks: ["Production schedule alignment with Boston timelines", "Google Classroom API limitations", "Insufficient engineering bandwidth"],
    teammates: ["Asha", "Hendy", "Carrie", "Jana", "Deanna", "Katy", "Elif", "Michael", "Tim"],
    narrative: "Shifting from broad demand validation toward deep, durable district partnerships. Depth over breadth. BPS is the anchor partnership for Q2.",
  },
  asha: {
    team: "Curriculum Sync",
    role: "Strategic Partnerships Manager",
    projects: ["District partnership depth strategy", "IM360 implementation across Canvas and GClassroom", "Partner retention for AY26-27"],
    risks: ["Reduced number of renewing Canvas districts", "Merge freeze for mobile release"],
    teammates: ["Esther", "Tim", "Hendy", "Carrie"],
    narrative: "Partnerships are the lifeblood of Curriculum Sync. The goal is 10 districts implementing IM360 across platforms.",
  },
  hendy: {
    team: "Curriculum Sync",
    role: "Software Engineer",
    projects: ["GClassroom Loader build", "BPS trial grade loading", "Monolith updates for GClassroom"],
    risks: ["Insufficient engineering bandwidth for loader and monolith work", "Production schedule alignment with Boston timelines"],
    teammates: ["Esther", "Katy", "Michael", "Carrie"],
    narrative: "Building the GClassroom loader that needs to be deployed to production with district-facing UI by end of Q2.",
  },
  carrie: {
    team: "Curriculum Sync / DevX",
    role: "Manager, Software Engineering",
    projects: ["Engineering team management across Curriculum Sync and DevX", "GClassroom Loader", "Platform engineering"],
    risks: ["Bandwidth split across two teams", "Engineering capacity constraints"],
    teammates: ["Esther", "Hendy", "Katy", "Michael", "Ankur", "Andrew", "Greg"],
    narrative: "Managing engineering across two product areas — balancing delivery for BPS timelines with platform GA readiness.",
  },
  jana: {
    team: "Curriculum Sync",
    role: "System Designer",
    projects: ["IM360 implementation design", "GClassroom student and teacher facing materials", "Canvas pilot improvements"],
    risks: ["Google Classroom feature and API limitations constraining design", "Limited iteration bandwidth on Canvas"],
    teammates: ["Esther", "Deanna", "Katy", "Hendy"],
    narrative: "Designing curriculum experiences within the constraints of what Google Classroom and Canvas actually allow.",
  },
  deanna: {
    team: "Curriculum Sync",
    role: "Instructional Designer",
    projects: ["IM360 Student Facing Materials for GClassroom", "IM360 Teacher Facing Materials", "Content QA"],
    risks: ["Production schedule for Slides delivery", "Lower adoption outside alpha districts"],
    teammates: ["Esther", "Jana", "Katy"],
    narrative: "Creating instructional materials that bridge the gap between curriculum design and what teachers actually need in the classroom.",
  },
  katy: {
    team: "Curriculum Sync",
    role: "Software Engineer",
    projects: ["GClassroom Loader", "BPS implementation", "Canvas Loader monolith work"],
    risks: ["Engineering bandwidth constraints", "Boston timeline pressure"],
    teammates: ["Esther", "Hendy", "Michael", "Carrie"],
    narrative: "Building the technical infrastructure that makes IM360 work across learning platforms.",
  },
  elif: {
    team: "Trust (cross-team)",
    role: "Product Operations Specialist, Trust",
    crossTeam: true,
    projects: [
      "Evaluators is building market presence — shipping evals, landing 15 partners, and establishing distribution channels",
      "Knowledge Graph Access is racing toward GA — implementing authorization and betting big on MCP as an AI-native access method",
      "Knowledge Graph Construction is completing data coverage across Math, ELA, and Science while scaling partner alignments",
      "Curriculum Sync is deepening district partnerships — BPS on Google Classroom is the anchor, Canvas pilots are being retained",
      "DevX is shipping Organizations and Dataset Catalog for the June release while building developer understanding",
    ],
    risks: ["Ambitious Q2 targets across every team", "Cross-team dependencies creating bottlenecks everywhere", "GA readiness timeline pressure across KG and DevX"],
    teammates: ["Esther", "Mydhili", "Anthony", "Adam", "Steve", "Merve", "Frankie", "Kristin"],
    narrative: "Trust work touches every product surface. When compliance, security, or operational requirements shift, all teams feel it. The connective tissue of the org.",
  },
  merve: {
    team: "Trust (cross-team)",
    role: "Trust",
    crossTeam: true,
    projects: [
      "Evaluators is building market presence — shipping evals, landing 15 partners, and establishing distribution channels",
      "Knowledge Graph Access is racing toward GA — implementing authorization and betting big on MCP as an AI-native access method",
      "Knowledge Graph Construction is completing data coverage across Math, ELA, and Science while scaling partner alignments",
      "Curriculum Sync is deepening district partnerships — BPS on Google Classroom is the anchor, Canvas pilots are being retained",
      "DevX is shipping Organizations and Dataset Catalog for the June release while building developer understanding",
    ],
    risks: ["Ambitious Q2 targets across every team", "Cross-team dependencies creating bottlenecks everywhere", "GA readiness timeline pressure across KG and DevX"],
    teammates: ["Esther", "Mydhili", "Anthony", "Adam", "Steve", "Elif", "Frankie", "Kristin"],
    narrative: "Trust work touches every product surface. When compliance, security, or operational requirements shift, all teams feel it. The connective tissue of the org.",
  },
  michael: {
    team: "Curriculum Sync",
    role: "Software Engineer",
    projects: ["GClassroom Loader", "IM360 Slides script hardening", "Canvas Loader improvements"],
    risks: ["Engineering bandwidth spread thin", "Production schedule alignment"],
    teammates: ["Esther", "Hendy", "Katy", "Carrie"],
    narrative: "Hardening the scripts and systems that load curriculum content into platforms at scale.",
  },
  tim: {
    team: "Curriculum Sync",
    role: "District Partnership Manager",
    projects: ["District partner relationships", "AY26-27 district retention", "BPS partnership coordination"],
    risks: ["Reduced number of renewing Canvas districts in AY26-27", "District engagement varies with curriculum adoption timing"],
    teammates: ["Esther", "Asha"],
    narrative: "On the front lines with districts. The team's goal is retaining at least 5 of 7 AY25-26 Canvas Pilot districts.",
  },

  // === DevX ===
  mydhili: {
    team: "DevX",
    role: "Product Manager",
    projects: ["Organizations on Platform for June release", "Dataset Catalog & Access Control", "Developer Profile Self-Service", "ASU+GSV release"],
    risks: ["Brand Evolution scope unknown", "KYC/Org Verification scope unclear", "Late-emerging dependencies from other product teams"],
    teammates: ["Andrew", "Jessica", "Ankur", "Jesus", "Carrie", "Jiali", "Ed", "Heather", "Greg", "Melissa"],
    narrative: "Two big releases in Q2: ASU+GSV and June. Organizations and Dataset Repository are the critical P0 capabilities.",
  },
  andrew: {
    team: "DevX",
    role: "Software Engineer",
    projects: ["Platform Organizations build", "Dataset Catalog implementation", "Integration tests for staging"],
    risks: ["Dataset Repository dependencies on Platform Engineering", "Brand Evolution impacting current P0s"],
    teammates: ["Mydhili", "Ankur", "Greg", "Jesus", "Jiali", "Carrie"],
    narrative: "Building the platform capabilities that enable the transition from authentication to authorization.",
  },
  jessica: {
    team: "DevX",
    role: "Product Designer",
    projects: ["Organizations UI design", "Developer Profile Self-Service", "MVP feedback improvements"],
    risks: ["Brand Evolution UI exploration scope unclear", "Competing design priorities"],
    teammates: ["Mydhili", "Ed", "Nicole", "Melissa"],
    narrative: "Designing the portal experiences that developers interact with — from org management to dataset discovery.",
  },
  ankur: {
    team: "DevX",
    role: "Manager, Software Engineering",
    projects: ["Platform engineering leadership", "CI/CD improvements", "99% uptime maintenance", "On-call management"],
    risks: ["Production readiness obligations pulling capacity", "Late-emerging dependencies from other teams"],
    teammates: ["Andrew", "Greg", "Jesus", "Jiali", "Carrie", "Mydhili"],
    narrative: "Keeping the platform stable and production-ready while the team ships major new capabilities.",
  },
  jesus: {
    team: "DevX",
    role: "Software Engineer",
    projects: ["Platform Organizations build", "SSO improvements", "Integration testing"],
    risks: ["KYC vendor security review timeline", "Engineering bandwidth constraints"],
    teammates: ["Ankur", "Andrew", "Greg", "Jiali", "Mydhili"],
    narrative: "Building authentication and authorization infrastructure that underpins the entire platform.",
  },
  jiali: {
    team: "DevX",
    role: "Software Engineer",
    projects: ["Dataset Catalog & Access Control", "Platform API work", "Gated dataset request flow"],
    risks: ["Dataset Repository dependencies on Platform Engineering", "AuthZ dependency"],
    teammates: ["Ankur", "Andrew", "Greg", "Jesus", "Mydhili"],
    narrative: "Making datasets discoverable and accessible — building the catalog that will serve gated and open data.",
  },
  ed: {
    team: "DevX",
    role: "Product Designer",
    projects: ["EDS/Brand Evolution UI exploration", "Mintlify theme updates", "Portal design"],
    risks: ["Brand Evolution scope and timeline TBD", "Implementation capacity for EDS changes"],
    teammates: ["Jessica", "Mydhili", "Heather"],
    narrative: "Exploring the visual future of the platform while supporting current design needs.",
  },
  heather: {
    team: "DevX",
    role: "Content Strategist",
    projects: ["Documentation training for product teams", "Mintlify analytics", "Explorer/Playground/Workbench guidance", "Style guide maintenance"],
    risks: ["Documentation ownership unclear across teams", "Incomplete analytics on user engagement with docs"],
    teammates: ["Mydhili", "Ed", "Jessica"],
    narrative: "Making DevEx a strategic documentation partner — codifying processes so every team can ship great docs.",
  },
  greg: {
    team: "DevX",
    role: "Software Engineer",
    projects: ["Integration tests for staging", "Uptime monitoring", "CI/CD pipeline improvements", "Tech debt reduction"],
    risks: ["Production readiness competing with feature work", "On-call burden"],
    teammates: ["Ankur", "Andrew", "Jesus", "Jiali", "Carrie"],
    narrative: "The engineering processes backbone — making sure staging deployments are validated and uptime stays at 99%.",
  },
  melissa: {
    team: "DevX",
    role: "User Experience Researcher",
    projects: ["Qualitative discovery on integration pain points", "Platform observability research", "Usability testing"],
    risks: ["Limited quant data to pair with qual insights", "Research capacity vs demand"],
    teammates: ["Mydhili", "Jessica", "Tristan"],
    narrative: "Uncovering the integration friction developers actually face — the top 3 pain points report will shape Q3.",
  },

  // === Evaluators ===
  anthony: {
    team: "Evaluators",
    role: "Product Manager",
    projects: ["Qualitative text complexity completion (Organization, Text Features, Intertextuality)", "GLA 2.0 rebuild", "SDK expansion", "Knowledge graph-based evals", "15 new partner target", "Distribution channel partnerships (Braintrust, Arize)", "Actionability proposals", "PMF baseline via Sean Ellis test"],
    risks: ["Team is lean and actively hiring PM + applied learning scientist", "15-partner target is ambitious", "Distribution channel timelines not fully controlled", "KG eval datasets require cross-team collaboration"],
    teammates: ["Adnan", "George", "Jessamy", "Ariena", "Nicole", "Fredrick", "Tristan", "Gary"],
    narrative: "Market-first thesis: to be market-first, you have to be in the market. Q2 is about shipping evals at steady pace, making them radically easy to access, and building presence that turns momentum into lasting traction.",
  },
  adnan: {
    team: "Evaluators",
    role: "Software Engineer",
    projects: ["SDK language expansion", "Evaluator development productivity", "Playground feature expansion", "SOTA program infrastructure"],
    risks: ["Engineering capacity is tight", "Multiple integration surfaces to maintain"],
    teammates: ["Anthony", "George", "Fredrick", "Gary"],
    narrative: "Building the developer-facing tools — SDK, Playground, and the infrastructure that makes evals accessible.",
  },
  george: {
    team: "Evaluators",
    role: "Manager, Software Engineering and Data Science",
    projects: ["Evaluator readiness pipeline", "Knowledge graph evaluators", "Team engineering leadership", "SOTA program"],
    risks: ["Lean team spread across evals, interaction, and GTM", "KG collaboration dependencies"],
    teammates: ["Anthony", "Adnan", "Fredrick", "Ariena", "Gary"],
    narrative: "Leading the engineering and data science efforts — balancing evaluator development velocity with production readiness.",
  },
  jessamy: {
    team: "Evaluators",
    role: "Applied Learning Science",
    projects: ["Qualitative text complexity evaluators (Organization, Text Features, Intertextuality)", "GLA 2.0 learning science foundation", "Field repository establishment"],
    risks: ["Qualitative text complexity has been in progress for most of a year", "Evaluator quality depends on learning science rigor"],
    teammates: ["Anthony", "Ariena", "Gary", "Desiree"],
    narrative: "The learning science backbone of evaluators — finishing qualitative text complexity unlocks the most important evaluator (GLA 2.0).",
  },
  ariena: {
    team: "Evaluators",
    role: "Data Scientist",
    projects: ["Knowledge graph-based evaluators", "Math standards alignment evals", "Multiple choice question quality evaluation", "Dataset-based evaluators"],
    risks: ["KG eval datasets depend on cross-team collaboration", "Licensing dependencies for external datasets"],
    teammates: ["Anthony", "George", "Gary", "Jessamy"],
    narrative: "Pushing into new subject areas through knowledge graph evals — math standards and MCQ quality are the frontier.",
  },
  nicole: {
    team: "Evaluators",
    role: "Product Designer",
    projects: ["Actionability design proposals", "Chatbot interface exploration", "Recommendations layer design", "SDK-Playground connection"],
    risks: ["Actionability direction still being explored", "Multiple design surfaces competing for attention"],
    teammates: ["Anthony", "Jessica", "Tristan"],
    narrative: "Tackling the actionability gap — developers find evals interesting but don't always know what to do next.",
  },
  fredrick: {
    team: "Evaluators",
    role: "Software Engineer",
    projects: ["SDK production readiness for GA", "Evaluator API development", "GitHub integration", "Quickstart guides"],
    risks: ["SDK, Playground, and GH all need to be production ready", "Engineering capacity stretched"],
    teammates: ["Anthony", "Adnan", "George"],
    narrative: "Getting the developer integration surfaces — SDK, API, GitHub — to GA quality.",
  },
  tristan: {
    team: "Evaluators",
    role: "User Experience Researcher",
    projects: ["PMF baseline research via Sean Ellis test", "Partner interview synthesis", "Actionability discovery research"],
    risks: ["PMF measurement heavily relies on achieving 15 partners first", "Research capacity shared across needs"],
    teammates: ["Anthony", "Nicole", "Melissa"],
    narrative: "Establishing whether evaluators have found product-market fit — the Sean Ellis test will be the first real signal.",
  },
  gary: {
    team: "Evaluators",
    role: "Data Scientist",
    projects: ["Evaluator development", "ELLIPSE field model validation", "Dataset-based evaluator pipeline", "Model performance benchmarking"],
    risks: ["Quill dataset delivery timeline uncertain", "Lean data science capacity"],
    teammates: ["Anthony", "George", "Ariena", "Jessamy"],
    narrative: "Validated the field model with ELLIPSE — now scaling that approach across more datasets and evaluator types.",
  },

  // === Knowledge Graph: Access ===
  adam: {
    team: "Knowledge Graph: Access",
    role: "Interim Product Manager",
    projects: ["AuthZ implementation across API, MCP, and flat files", "MCP as first-class KG access method", "KG Playground", "Agentic workflow POCs", "GA launch readiness"],
    risks: ["APIs may be prematurely moving to v1 with limited usage data", "Production obligations pulling capacity from feature work", "Flat file ownership transition unclear", "Dataset versioning not owned by team"],
    teammates: ["Parva", "Shaeera", "Christopher", "Tianyou", "Li"],
    narrative: "Two focused bets: implement authorization to unlock full dataset availability, and prioritize AI-native workflows. MCP is becoming a first-class access method. The team doesn't yet know exactly how far it is from GA.",
  },
  parva: {
    team: "Knowledge Graph: Access / Construction",
    role: "Manager, Software Engineering",
    projects: ["Engineering leadership across KG Access and Construction", "API versioning strategy", "Production readiness", "On-call setup"],
    risks: ["Split across two KG teams", "Production scale obligations competing with feature development"],
    teammates: ["Adam", "Steve", "Christopher", "Tianyou", "Li", "Rabia", "Meghna", "Warenga"],
    narrative: "Managing engineering across both KG teams — navigating the evolving boundary between Construction and Access.",
  },
  shaeera: {
    team: "Knowledge Graph: Access",
    role: "User Researcher",
    projects: ["KG product analytics reporting", "UXR on integration patterns", "Understanding when different access methods are preferred"],
    risks: ["Incomplete analytics across documentation and touchpoints", "Limited usage signal due to AuthZ constraints"],
    teammates: ["Adam", "Melissa", "Tristan"],
    narrative: "Building understanding of how developers actually use the Knowledge Graph — which access methods work and why.",
  },
  christopher: {
    team: "Knowledge Graph: Access",
    role: "Software Engineer",
    projects: ["MCP tool migration to REST APIs", "AuthZ for gated datasets", "Semantic search for MCP", "API versioning"],
    risks: ["MCP utilizes stale data currently", "Production readiness unknowns"],
    teammates: ["Adam", "Parva", "Tianyou", "Li"],
    narrative: "Migrating MCP tools to use real production KG data — making the AI-native access path reliable and current.",
  },
  tianyou: {
    team: "Knowledge Graph: Access",
    role: "Software Engineer",
    projects: ["KG Playground", "REST API development", "Dataset coverage expansion", "MCP improvements"],
    risks: ["Full dataset coverage needed across all integration methods", "API versioning uncertainty"],
    teammates: ["Adam", "Parva", "Christopher", "Li"],
    narrative: "Expanding KG dataset availability across every access method — from flat files to APIs to MCP.",
  },
  li: {
    team: "Knowledge Graph: Access",
    role: "Software Engineer",
    projects: ["AuthZ implementation", "API development", "MCP backend architecture", "Production monitoring"],
    risks: ["AuthZ is the key blocker for partner access", "Production readiness measurement unclear"],
    teammates: ["Adam", "Parva", "Christopher", "Tianyou"],
    narrative: "Building the authorization layer that unlocks everything — once AuthZ ships, partners can finally access gated datasets.",
  },

  // === Knowledge Graph: Construction ===
  steve: {
    team: "Knowledge Graph: Construction",
    role: "Product Manager",
    projects: ["EL Education curriculum", "OSE (OpenSciEd)", "IM improvements", "Foundational Literacy LCs", "LC alignments to Standards and IM", "EEDI Misconceptions", "Partner alignments (BrainPOP, CoTeach, OKO Labs, Glimmer, Modern Classroom Project)", "Partition and versioning decisions"],
    risks: ["More work than typical quarter capacity", "External partner velocity (Eedi licensing, ANet datasets)", "Evolving responsibility boundary with Access team", "Non-CCSS state reviews adding weeks with zero margin"],
    teammates: ["Desiree", "Rabia", "Meghna", "Sadie", "Miles", "Parva", "Warenga", "Pranjli"],
    narrative: "Three buckets: Data (completing coverage for GA), Partners (generalizing alignment approach), Systems (rapid decisions on partitions, versioning, flat files). There is more to do than a typical quarter allows.",
  },
  desiree: {
    team: "Knowledge Graph: Construction",
    role: "Applied Learning Science",
    projects: ["Foundational Literacy LCs", "Learning component quality", "LC alignments to standards", "Science LCs discovery"],
    risks: ["LC work has been long-running with tight timelines", "Science learning components not yet covered"],
    teammates: ["Steve", "Jessamy", "Sadie", "Miles"],
    narrative: "Building the learning science foundation of the Knowledge Graph — literacy LCs are the next frontier.",
  },
  rabia: {
    team: "Knowledge Graph: Construction",
    role: "Software Engineer",
    projects: ["EL Education ingestion pipeline", "OSE data processing", "Pipeline process improvements", "Dataset construction tooling"],
    risks: ["Quantity of work vs fixed GA deadline", "External dataset dependencies"],
    teammates: ["Steve", "Parva", "Meghna", "Warenga", "Pranjli"],
    narrative: "Building and running the pipelines that turn raw curriculum and standards data into structured Knowledge Graph datasets.",
  },
  meghna: {
    team: "Knowledge Graph: Construction",
    role: "Software Engineer",
    projects: ["Standards update procedures", "Dataset construction", "Partition system implementation", "Pipeline improvements"],
    risks: ["System decisions (partitions, versioning) need to be made early to unblock work", "Construction vs Access boundary still evolving"],
    teammates: ["Steve", "Parva", "Rabia", "Warenga", "Pranjli"],
    narrative: "Building the systems infrastructure for KG Construction — partitions, versioning, and release management.",
  },
  sadie: {
    team: "Knowledge Graph: Construction",
    role: "Data Scientist",
    projects: ["LC alignment quality", "EEDI Misconceptions data", "Standards crosswalks", "Non-CCSS state alignment"],
    risks: ["Non-CCSS state reviews often add weeks with near-zero margin", "Eedi licensing depends on grant funding"],
    teammates: ["Steve", "Desiree", "Miles", "Ariena"],
    narrative: "Ensuring alignment quality across learning components, standards, and curriculum — the data science backbone of construction.",
  },
  miles: {
    team: "Knowledge Graph: Construction",
    role: "Machine Learning Engineer",
    projects: ["Generalized text-to-LC matching", "ML-powered alignment approaches", "Scalable partner alignment solutions"],
    risks: ["Semantic search / alignment endpoints not ready yet", "Partner alignment demand outpacing capacity"],
    teammates: ["Steve", "Desiree", "Sadie", "Pranjli"],
    narrative: "Building ML approaches to make partner alignments scalable instead of manual — the v1 generalized matching is key.",
  },
  warenga: {
    team: "Knowledge Graph: Construction",
    role: "Software Engineer",
    projects: ["Dataset construction pipelines", "Flat file generation", "Feature requests and bug fixes"],
    risks: ["Flat file ownership transition unclear", "Pipeline capacity stretched"],
    teammates: ["Steve", "Parva", "Rabia", "Meghna"],
    narrative: "Keeping the construction pipelines running while the team navigates the shift in how flat files are owned and generated.",
  },
  pranjli: {
    team: "Knowledge Graph: Construction",
    role: "Machine Learning Engineer",
    projects: ["LC alignment ML models", "Dataset processing", "Automated alignment tooling"],
    risks: ["ML capacity shared with other priorities", "External dataset quality varies"],
    teammates: ["Steve", "Miles", "Rabia", "Meghna"],
    narrative: "Building the ML models that power learning component alignments at scale.",
  },

  // === Cross-team / Leadership ===
  frankie: {
    team: "Cross-team",
    role: "Engineering Manager",
    crossTeam: true,
    projects: [
      "Evaluators is building market presence — shipping evals, landing 15 partners, and establishing distribution channels",
      "Knowledge Graph Access is racing toward GA — implementing authorization and betting big on MCP as an AI-native access method",
      "Knowledge Graph Construction is completing data coverage across Math, ELA, and Science while scaling partner alignments",
      "Curriculum Sync is deepening district partnerships — BPS on Google Classroom is the anchor, Canvas pilots are being retained",
      "DevX is shipping Organizations and Dataset Catalog for the June release while building developer understanding",
    ],
    risks: ["Engineering capacity is stretched thin across every team", "Multiple teams lean and actively hiring", "Delivery pressure against fixed GA timeline"],
    teammates: ["Carrie", "Ankur", "George", "Parva", "Kristin", "Elif", "Merve"],
    narrative: "Engineering leadership across teams — keeping delivery on track, managing capacity constraints, and scaling up hiring while every team pushes toward ambitious Q2 goals.",
  },
  kristin: {
    team: "Cross-team",
    role: "VP of Product",
    crossTeam: true,
    projects: [
      "Evaluators is building market presence — shipping evals, landing 15 partners, and establishing distribution channels",
      "Knowledge Graph Access is racing toward GA — implementing authorization and betting big on MCP as an AI-native access method",
      "Knowledge Graph Construction is completing data coverage across Math, ELA, and Science while scaling partner alignments",
      "Curriculum Sync is deepening district partnerships — BPS on Google Classroom is the anchor, Canvas pilots are being retained",
      "DevX is shipping Organizations and Dataset Catalog for the June release while building developer understanding",
    ],
    risks: ["Ambitious Q2 targets across all teams", "Hiring gaps in PM and learning science", "Cross-team dependencies creating bottlenecks", "GA readiness across multiple surfaces"],
    teammates: ["Anthony", "Adam", "Steve", "Esther", "Mydhili", "Frankie", "Elif", "Merve"],
    narrative: "Setting the strategic direction — GA launch, market-first positioning, and making sure the teams can actually deliver on ambitious Q2 goals.",
  },
};

/**
 * Look up team context for a player by first name.
 * Returns null if no match found.
 */
export function getTeamContext(playerName) {
  if (!playerName) return null;
  const firstName = playerName.trim().split(/\s+/)[0].toLowerCase();
  return TEAM_DATA[firstName] || null;
}

/**
 * Given a list of all player names in the room, find which ones
 * have team context and return a summary of team relationships.
 */
export function getRoomTeamContext(playerNames) {
  const matched = [];
  for (const name of playerNames) {
    const ctx = getTeamContext(name);
    if (ctx) {
      matched.push({ name: name.trim().split(/\s+/)[0], ...ctx });
    }
  }
  return matched;
}
