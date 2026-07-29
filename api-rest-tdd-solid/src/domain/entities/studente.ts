import { Entity } from "../../core/domain/Entity.js";

type StudentProps = {

    nome: string
    email: string
    submission: string;

    createdAt: Date;
};

export class Student extends Entity<StudentProps> {

    private constructor (props: StudentProps, id?: string){
        super(props, id)
    }
    static create(props: StudentProps, id?: string) {
        const student = new Student(props, id)
        return student
    }
}