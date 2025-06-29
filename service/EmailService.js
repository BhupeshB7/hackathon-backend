export class EmailService {
    constructor() {
        if (this.constructor === EmailService) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }
    async sendEmail(email, OTP) {
        throw new Error("Method sendEmail must be implemented.");
    }
}
