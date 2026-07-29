import { Submission } from "../../domain/entities/submission.js";

type CreateChallengeSubRequest = {

    studentId: string;
    challengId: string
    title: string;
    body: string

}


export class CreateChallengeSubUseCase {

    execute({studentId, challengId }:  CreateChallengeSubRequest) {
        const submission = Submission.create({
            studentId,
            challengId,
        })
        return submission

    }
     
}