import express, { Request, Response } from "express";
import {
	createForm,
	getForm,
	submitFormResponse,
	getFormResponses
} from "../../Database/helpers/FormHelpers";

const router = express.Router();

router.post("/form/create", async (req: Request, res: Response) => {
	const { authorId, questions } = req.body;
	try {
		await createForm(authorId, questions);
		res.status(201).json({ message: "Form created successfully" });
	} catch (error) {
		res.status(500).json({ error: "Failed to create form" });
	}
});

router.get("/form/:id", async (req: Request, res: Response) => {
	const { id } = req.params;
	try {
		const form = await getForm(id);
		if (form) {
			form.questions = JSON.parse(form.questions);
			res.status(200).json(form);
		} else {
			res.status(404).json({ error: "Form not found" });
		}
	} catch (error) {
		res.status(500).json({ error: "Failed to fetch form" });
	}
});

router.post("/form/:id/submit", async (req: Request, res: Response) => {
	const { id } = req.params;
	const { respondentId, responses } = req.body;
	try {
		await submitFormResponse(
			id,
			respondentId,
			req.socket.remoteAddress || "unknown_ip_addr",
			responses
		);
		res.status(201).json({
			message: "Form response submitted successfully"
		});
	} catch (error) {
		res.status(500).json({ error: "Failed to submit form response" });
	}
});

router.get("/form/:id/responses", async (req: Request, res: Response) => {
	const { id } = req.params;
	try {
		const responses = await getFormResponses(id);
		res.status(200).json(responses);
	} catch (error) {
		res.status(500).json({ error: "Failed to fetch form responses" });
	}
});

export const formRouter = router;
