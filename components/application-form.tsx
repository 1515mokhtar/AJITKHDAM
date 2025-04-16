"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import { createApplication } from "@/lib/firebase/applications"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ApplicationFormProps {
  jobId: string
  questions: string[]
}

export default function ApplicationForm({ jobId, questions }: ApplicationFormProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""))
  const [interviewType, setInterviewType] = useState("remote")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
  }

  const handleNextStep = () => {
    if (step === 1 && questions.length > 0) {
      // Validate that all questions are answered
      const unanswered = answers.findIndex((answer) => !answer.trim())
      if (unanswered !== -1) {
        setError(`Please answer question ${unanswered + 1}`)
        return
      }
    }

    setError(null)
    setStep(step + 1)
  }

  const handlePrevStep = () => {
    setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const applicationData = {
        jobId,
        userId: user.uid,
        answers,
        interviewPref: {
          type: interviewType,
          slots: [],
        },
        cvUrl: user.cvUrl || "",
        status: "pending",
        appliedAt: new Date(),
      }

      await createApplication(applicationData)
      setStep(3) // Success step
    } catch (err) {
      setError("Failed to submit application. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center">
        <p className="mb-4">Please sign in to apply for this job</p>
        <Button onClick={() => router.push("/login")}>Sign In</Button>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-medium">Step 1: Answer Questions</h3>

          {questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={index} className="space-y-2">
                  <Label>{question}</Label>
                  <Textarea
                    value={answers[index]}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder="Your answer..."
                    className="min-h-[100px]"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No questions from the employer.</p>
          )}

          <div className="flex justify-end">
            <Button onClick={handleNextStep}>Next Step</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-medium">Step 2: Interview Preferences</h3>

          <div className="space-y-2">
            <Label>Preferred Interview Type</Label>
            <RadioGroup value={interviewType} onValueChange={setInterviewType} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remote" id="remote" />
                <Label htmlFor="remote" className="cursor-pointer">
                  Remote (Video Call)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in-person" id="in-person" />
                <Label htmlFor="in-person" className="cursor-pointer">
                  In-Person
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="phone" />
                <Label htmlFor="phone" className="cursor-pointer">
                  Phone Call
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevStep}>
              Previous Step
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center py-4">
          <h3 className="text-lg font-medium text-green-600">Application Submitted!</h3>
          <p className="mt-2 text-muted-foreground">
            Your application has been successfully submitted. You can track its status in your dashboard.
          </p>
          <Button className="mt-4" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      )}
    </div>
  )
}

