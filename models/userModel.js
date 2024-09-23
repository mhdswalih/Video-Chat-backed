class UserModel {
    constructor() {
        this.waitingUser = null;
    }

    addWaitingUser(ws) {
        this.waitingUser = ws;
    }

    getWaitingUser() {
        return this.waitingUser;
    }

    removeWaitingUser() {
        this.waitingUser = null;
    }
}

module.exports = new UserModel();
