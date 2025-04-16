"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"
import { useAuth } from "@/context/auth-context"
import { createJob } from "@/lib/firebase/jobs"
import { AlertCircle, Plus, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function PostJobPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [type, setType] = useState("Full-time")
  const [location, setLocation] = useState("")
  const [salary, setSalary] = useState("")
  const [description, setDescription] = useState("")
  const [deadline, setDeadline] = useState<Date | undefined>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  )
  const [questions, setQuestions] = useState<string[]>([])
  const [newQuestion, setNewQuestion] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAddQuestion = () => {
    if (newQuestion.trim() && questions.length < 5) {
      setQuestions([...questions, newQuestion.trim()])
      setNewQuestion("")
    }
  }

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("You must be logged in to post a job")
      return
    }

    if (!deadline) {
      setError("Please set an application deadline")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const jobData = {
        title,
        type,
        location,
        salary,
        description,
        deadline,
        questions,
        companyId: user.uid,
        company: {
          name: user.companyName || "Company Name",
          logo: user.companyLogo || "/placeholder.svg?height=100&width=100",
        },
        postedAt: new Date(),
      }

      const jobId = await createJob(jobData)
      router.push(`/jobs/${jobId}`)
    } catch (err) {
      setError("Failed to post job. Please try again.")
      setIsLoading(false)
    }
  }

  if (!user || user.role !== "employer") {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-bold">Employer Account Required</h2>
          <p className="mt-2 text-muted-foreground">You need an employer account to post jobs.</p>
          <Button className="mt-4" onClick={() => router.push("/register")}>
            Create Employer Account
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Post a New Job</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Frontend Developer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Job Type</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full-time">Full-time</SelectItem>
                <SelectItem value="Part-time">Part-time</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Internship">Internship</SelectItem>
                <SelectItem value="Remote">Remote</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. New York, Remote"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary">Salaire</Label>
            <Input
              id="salary"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="ex: 45000€ - 55000€ par an"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Application Deadline</Label>
            <DatePicker date={deadline} setDate={setDeadline} className="w-full" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Job Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the job responsibilities, requirements, benefits, etc."
            className="min-h-[200px]"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Application Questions (Optional)</Label>
          <p className="text-sm text-muted-foreground">Add up to 5 questions for applicants to answer when applying.</p>

          <div className="flex gap-2">
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="e.g. Why do you want to work with us?"
              disabled={questions.length >= 5}
            />
            <Button type="button" onClick={handleAddQuestion} disabled={!newQuestion.trim() || questions.length >= 5}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {questions.length > 0 && (
            <div className="mt-2 space-y-2">
              {questions.map((question, index) => (
                <div key={index} className="flex items-center justify-between rounded-md border p-2">
                  <span>{question}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveQuestion(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Posting..." : "Post Job"}
          </Button>
        </div>
      </form>
    </div>
  )
}

