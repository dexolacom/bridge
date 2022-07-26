import { RequestExtensions, ResponseExtensions, Server, Protocol } from "restana";
import restana from "restana";
const app = restana();

app.get("/ping", (req: RequestExtensions, res:ResponseExtensions) => {
	res.send("pong");
});

const PORT = Number(process.env.PORT) || 5000;

export const startServer = () => {
	app.start(PORT).then((server: Server<Protocol.HTTP>) => {

		if (server) {
			console.log(
				"=====================================> Service running on port",
				PORT,
				"<====================================="
			);
		} else {
			console.log(
				"Service failed to running server on port ",
				PORT
			);
		}
	});
};