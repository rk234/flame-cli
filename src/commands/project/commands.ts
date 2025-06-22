import { buildCommand, buildRouteMap } from "@stricli/core";


export const listCommand = buildCommand({
	docs: { brief: "Lists registered projects" },
	func: () => console.log("List"),
	parameters: {}
})

export const projectRoutes = buildRouteMap({
	docs: {
		brief: "Project actions"
	},
	routes: {
		list: listCommand,
	}
})
