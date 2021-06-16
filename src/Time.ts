import { Clock } from "three";

export class TimeHolder extends Clock {

    public deltaTime = 0;

    getDelta(): number {
        this.deltaTime = super.getDelta();
        return this.deltaTime;
    }
}

export const Time = new TimeHolder();