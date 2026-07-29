import { Entity } from "../../core/domain/Entity.js";

type SubmissionProps = {
    
    challengId: string
    studentId: string
    createdAt?: Date;
    submiddionId?: string;
    onSubmit?: void;
};

export class Submission extends Entity<SubmissionProps> {

    private constructor (props: SubmissionProps, id?: string){
        super(props, id)
    }
    static create(props: SubmissionProps, id?: string) {
        const submission = new Submission({

            ...props,
            createdAt: props.createdAt ?? new Date(), 
        }, id)
        return submission
    }
}