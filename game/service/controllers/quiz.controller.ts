import { Quiz } from "../models/quiz.entity";
import { QuizRepository } from "../repositories/quiz.repo";
import Controller from "./controller";
import { Request, Response } from "express";
import { Agent, run, setDefaultOpenAIKey, tool } from '@openai/agents';
import { title } from "process";
import z from "zod";


class QuizController extends Controller {
    /**
     * Get Quiz List
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async quizzes(req: Request, res: Response) {
        try {
            const repo: QuizRepository = new QuizRepository();
            let questionData = await repo.getAllQuizzes(req.body);

            if (questionData) {
                return res.send(super.response(super._200, questionData))
            } else {
                return res.send(super.response(super._404, questionData, [super._404.message]))
            }

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)))
        }
    }

    /**
     * Get Quiz by Id
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async quiz(req: Request, res: Response) {
        try {
            const repo: QuizRepository = new QuizRepository();
            let { id } = req.params;

            let questionData = await repo.getQuizById(id);

            if (questionData) {
                return res.send(super.response(super._200, questionData))
            } else {
                return res.send(super.response(super._404, questionData, [super._404.message]))
            }

        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)))
        }
    }


    /**
     * Add Quiz
     * @param req Request
     * @param res Response
     * @returns Json Object
     */
    public static async add(req: Request, res: Response) {
        try {
            const repo: QuizRepository = new QuizRepository();

            const {
                title,
                questions
            } = req.body

            let questionInstance = new Quiz();

            questionInstance.title = title,
            questionInstance.questions = questions

            let questionData = await repo.saveQuiz(questionInstance);

            return res.send(super.response(super._200, questionData));
        } catch (error) {
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }

    /**
     * Create a Quiz using an Agent
     * @param req Request containing prompt for quiz generation
     * @param res Response with generated quiz data
     * @returns Json Object
     */
    public static async addAgentQuiz(req: Request, res: Response) {
        try {
            const repo: QuizRepository = new QuizRepository();
            const { prompt } = req.body;

            // Set OpenAI API key
            setDefaultOpenAIKey(process.env.OPENAI_API_KEY!);

            // Validate input
            if (!prompt || typeof prompt !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid prompt for quiz generation'
                });
            }

            // Define the quiz output schema using Zod
            const quizOutputSchema = z.object({
                title: z.string().describe('The title of the quiz'),
                questions: z.array(
                    z.object({
                        question: z.string().describe('The question text'),
                        answers: z.array(
                            z.object({
                                answer: z.string().describe('The answer option text'),
                                correctAnswer: z.boolean().describe('Whether this is the correct answer')
                            })
                        ).length(4).describe('Four answer options with correctAnswer flags'),
                    })
                ).describe('Array of quiz questions')
            });

            // Define the quiz generation tool
            const generateQuizTool = tool({
                name: 'generate_quiz',
                description: 'Generate a comprehensive quiz with multiple questions based on user requirements. Creates structured quizzes with questions, options, and correct answers.',
                parameters: z.object({
                    topic: z.string().describe('The main topic or subject for the quiz'),
                    difficulty: z.enum(['easy', 'medium', 'hard']).nullable().describe('Difficulty level of the quiz'),
                    numQuestions: z.number().min(1).max(10).nullable().default(5).describe('Number of questions to generate')
                }),
                execute: async ({ topic, difficulty = 'medium', numQuestions = 5 }) => {
                    // This will be executed by the agent to structure the quiz
                    return {
                        success: true,
                        topic,
                        difficulty: difficulty || 'medium',
                        numQuestions: numQuestions || 5,
                        message: 'Quiz structure ready for generation'
                    };
                },
            });

            // Create the agent with quiz generation capabilities and output type
            const generateQuizAgent = Agent.create({
                name: 'Quiz Generator',
                instructions: `You are an expert quiz generator. Your role is to:
                1. Analyze the user's prompt to understand the topic, difficulty, and requirements
                2. Generate high-quality quiz questions that are clear, educational, and engaging
                3. Create multiple-choice questions with 4 answer options each
                4. Mark exactly ONE answer as correct (correctAnswer: true) and the rest as false
                5. Provide explanations for correct answers when appropriate
                
                IMPORTANT: You must return your response as a valid JSON object matching this exact structure:
                {
                    "title": "Quiz Title",
                    "questions": [
                        {
                            "question": "Question text",
                            "answers": [
                                {
                                    "answer": "Option A text",
                                    "correctAnswer": false
                                },
                                {
                                    "answer": "Option B text",
                                    "correctAnswer": true
                                },
                                {
                                    "answer": "Option C text",
                                    "correctAnswer": false
                                },
                                {
                                    "answer": "Option D text",
                                    "correctAnswer": false
                                }
                            ],
                        }
                    ]
                }
                
                Each question MUST have exactly 4 answers in the "answers" array.
                Each answer MUST have "answer" (string) and "correctAnswer" (boolean) properties.
                Only ONE answer per question should have "correctAnswer": true.
                Do not include any additional text before or after the JSON object.`,
                tools: [generateQuizTool],
                outputType: quizOutputSchema
            });

            // Run the agent to generate the quiz
            const result = await run(generateQuizAgent, prompt);

            // Log the final output for debugging
            console.log('=== Agent Run Complete ===');
            console.log('Final Output Type:', typeof result.finalOutput);
            console.log('Final Output:', JSON.stringify(result.finalOutput, null, 2));
            console.log('Last Agent:', result.lastAgent?.name);
            console.log('========================');

            // Extract quiz data from finalOutput
            let quizData;

            if (result.finalOutput && typeof result.finalOutput === 'object') {
                // finalOutput is already parsed as an object
                quizData = result.finalOutput as z.infer<typeof quizOutputSchema>;
            } 

            // Validate quiz data structure
            if (!quizData || !quizData.title || !quizData.questions || !Array.isArray(quizData.questions)) {
                console.error('Invalid quiz data structure:', quizData);
                return res.status(400).json({
                    success: false,
                    message: 'Agent returned invalid quiz structure',
                    data: quizData
                });
            }

            // Create Quiz instance
            const questionInstance = new Quiz();
            questionInstance.title = quizData.title;
            questionInstance.questions = quizData.questions as any;
            questionInstance.isPublished = true;
            questionInstance.createdAt = new Date();
            questionInstance.updatedAt = new Date();
            questionInstance.deleted = false;

            // Validate that we have questions
            if (questionInstance.questions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Agent could not generate quiz questions. Please try with a more specific prompt.',
                    agentResponse: result
                });
            }

            // Save to database
            const questionData = await repo.saveQuiz(questionInstance);

            // Return success response
            return res.send(super.response(super._200, questionData));

        } catch (error) {
            console.error('Error in addAgentQuiz:', error);
            return res.send(super.response(super._500, null, super.ex(error)));
        }
    }
}

export default QuizController;