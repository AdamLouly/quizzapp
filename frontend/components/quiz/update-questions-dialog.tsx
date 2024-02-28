import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Check } from "lucide-react";

export default function UpdateQuestionsDialog() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([
    {
      question: "What is the capital of France?",
      answers: [
        { answer: "Paris", isCorrect: true },
        { answer: "London", isCorrect: false },
        { answer: "Berlin", isCorrect: false },
        { answer: "Madrid", isCorrect: false },
      ],
    },
    {
      question: "What is the capital of France?",
      answers: [
        { answer: "Paris", isCorrect: true },
        { answer: "London", isCorrect: false },
        { answer: "Berlin", isCorrect: false },
        { answer: "Madrid", isCorrect: false },
      ],
    },
  ]);

  const handleNext = () => {
    setCurrentQuestionIndex((prevIndex) =>
      prevIndex < questions.length - 1 ? prevIndex + 1 : prevIndex,
    );
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : prevIndex,
    );
  };

  const handleQuestionChange = (e) => {
    const updatedQuestions = questions.map((question, index) =>
      index === currentQuestionIndex
        ? { ...question, question: e.target.value }
        : question,
    );
    setQuestions(updatedQuestions);
  };

  const handleAnswerChange = (index, e) => {
    const updatedQuestions = questions.map((question, qIndex) => {
      if (qIndex === currentQuestionIndex) {
        return {
          ...question,
          answers: question.answers.map((answer, aIndex) =>
            aIndex === index ? { ...answer, answer: e.target.value } : answer,
          ),
        };
      }
      return question;
    });
    setQuestions(updatedQuestions);
  };

  const handleSetCorrect = (index) => {
    const updatedQuestions = questions.map((question, qIndex) => {
      if (qIndex === currentQuestionIndex) {
        const updatedAnswers = question.answers.map((answer, aIndex) => ({
          ...answer,
          isCorrect: index === aIndex,
        }));
        return { ...question, answers: updatedAnswers };
      }
      return question;
    });
    setQuestions(updatedQuestions);
  };

  const answerInputStyle = (isCorrect) =>
    `border-2 rounded-lg shadow-sm p-3 w-full transition-colors ${
      isCorrect
        ? "border-green-500 focus:border-green-700"
        : "border-red-500 focus:border-red-700"
    }`;

  const correctButtonStyle = (isCorrect) =>
    `px-6 py-2 rounded-full text-sm font-medium shadow transition-colors flex items-center gap-2 ${
      isCorrect
        ? "bg-green-500 hover:bg-green-600 text-white"
        : "bg-red-200 hover:bg-green-600 hover:text-white text-white>"
    }`;

  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleEditQuestions = () => {

  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="text-white bg-blue-600 hover:bg-blue-700 font-semibold rounded-lg text-sm px-4 py-2 transition-colors">
          Update Questions
        </Button>
      </DialogTrigger>
      <DialogContent>
        <div className="p-6 space-y-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold">Quiz for Teachers</h3>
            <p className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          <Textarea
            id="question"
            value={questions[currentQuestionIndex].question}
            onChange={handleQuestionChange}
            placeholder="Type your question here"
            className="border-2 rounded-lg p-3 shadow-sm w-full"
          />
          <div className="space-y-3">
            {questions[currentQuestionIndex].answers.map((answer, index) => (
              <div key={index} className="flex items-center gap-3">
                <Input
                  className={answerInputStyle(answer.isCorrect)}
                  value={answer.answer}
                  onChange={(e) => handleAnswerChange(index, e)}
                />
                <Button
                  className={correctButtonStyle(answer.isCorrect)}
                  onClick={() => handleSetCorrect(index)}
                >
                  {answer.isCorrect ? <Check /> : <Check />}
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-auto grid gap-4 sm:grid-cols-2">
            <Button
              className="w-full text-gray-800 bg-gray-200 hover:bg-gray-300 font-medium rounded-lg text-sm px-5 py-2 transition-colors"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            {!isLastQuestion ? (
              <Button
                variant="outline"
                className="w-full text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-2 transition-colors"
                onClick={handleNext}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full text-white bg-blue-600 hover:bg-blue-700 hover:text-white font-medium rounded-lg text-sm px-5 py-2 transition-colors"
                onClick={handleEditQuestions()}
              >
                Submit
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
