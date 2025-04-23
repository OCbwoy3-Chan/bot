import * as s from "@sentry/bun";
import { ExclusiveEventHintOrCaptureContext } from "@sentry/core/build/types/utils/prepareEvent";
import { configDotenv } from "dotenv";
import { getDistroNameSync, logger } from "./Utility";

export function InitSentry() {
	if (process.env.SENTRY_DSN) {
		logger.info("[SENTRY] Loading Sentry");
		configDotenv();
		s.init({
			dsn: process.env.SENTRY_DSN,
			tracesSampleRate: 1.0
		});
	}
}

export function captureSentryException(
	e: Error | any,
	hint: ExclusiveEventHintOrCaptureContext = {}
) {
	if (process.env.SENTRY_DSN) {
		(hint as any).contexts = (hint as any).contexts || {};
		(hint as any).contexts = {
			os: {
				name: getDistroNameSync()
			},
			app: {
				app_name: "112",
				app_identifier: "dev.ocbwoy3.sbgbans"
			}
		};
		(hint as any).tags = (hint as any).tags || {};
		(hint as any).tags.sentryUtilCapture = true;
		logger.info(`[SENTRY] Reporting Error: ${e}`);
		s.captureException(e, hint as ExclusiveEventHintOrCaptureContext);
	}
}
