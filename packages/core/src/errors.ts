export class ApiError extends Error {
	status: number;
	type: string;
	constructor(status: number, type: string, message: string) {
		super(message);
		this.status = status;
		this.type = type;
	}
}

export class AuthenticationError extends ApiError {}
