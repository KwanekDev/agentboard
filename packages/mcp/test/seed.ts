process.env.AGENTBOARD_DB = process.argv[2];
const { createProject } = await import("@agentboard/core");
const p = createProject(process.argv[3]);
console.log(JSON.stringify({ id: p.id }));
