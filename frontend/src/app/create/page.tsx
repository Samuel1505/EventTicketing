"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sidebar } from "@/components/dashboard/sidebar"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function CreateEventPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    eventName: "",
    eventDescription: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    expectedAttendees : "",
    eventBanner: null as File | null,
  })

  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({
        ...prev,
        eventBanner: file,
      }))

      // Create preview URL (base64)
      const reader = new FileReader()
      reader.onload = (e) => {
        setBannerPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleContinue = () => {
    // Store form data in localStorage for the preview page
    // Store bannerPreview (base64) as bannerBase64 for IPFS upload in preview
    localStorage.setItem(
      "eventFormData",
      JSON.stringify({
        ...formData,
        bannerPreview, // For display in preview
        bannerBase64: bannerPreview, // Base64 for converting to File in preview if needed
      }),
    )
    router.push("/create/preview")
  }

  const isFormValid = () => {
    return (
      formData.eventName &&
      formData.eventDescription &&
      formData.location &&
      formData.startDate &&
      formData.startTime &&
      formData.endDate &&
      formData.endTime &&
      formData.expectedAttendees &&
      bannerPreview // Banner is now required
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
            <p className="text-muted-foreground">Fill in the details to create your blockchain-powered event</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Event Name */}
              <div className="space-y-2">
                <Label htmlFor="eventName">Event Name *</Label>
                <Input
                  id="eventName"
                  name="eventName"
                  placeholder="Enter event name"
                  value={formData.eventName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Event Description */}
              <div className="space-y-2">
                <Label htmlFor="eventDescription">Event Description *</Label>
                <Textarea
                  id="eventDescription"
                  name="eventDescription"
                  placeholder="Describe your event..."
                  rows={4}
                  value={formData.eventDescription}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Enter event location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Start Date and Time */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>


              {/* End Date and Time */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {/* Attendee */}
              <div className="space-y-2">
                <Label htmlFor="attendee">Expected Attendee *</Label>
                <Input
                  id="expectedAttendees"
                  name="expectedAttendees"
                  placeholder="Enter expected Attendees"
                  value={formData.expectedAttendees}
                  onChange={handleInputChange}
                  required
                />
              </div>
              </div>

              {/* Event Banner - Now Required */}
              <div className="space-y-2">
                <Label htmlFor="eventBanner">Event Banner *</Label>
                <p className="text-sm text-muted-foreground">Upload an image for your event (required by smart contract)</p>
                <div className="space-y-4">
                  <Input
                    id="eventBanner"
                    name="eventBanner"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                    required
                  />
                  {bannerPreview && (
                    <div className="relative">
                      <Image
                        src={bannerPreview}
                        alt="Banner preview"
                        width={800}
                        height={192}
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setBannerPreview(null)
                          setFormData((prev) => ({ ...prev, eventBanner: null }))
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  {!bannerPreview && (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      <div className="text-muted-foreground">
                        <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm font-medium">Click to upload an event banner</p>
                        <p className="text-xs">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Continue Button */}
              <div className="pt-4">
                <Button onClick={handleContinue} disabled={!isFormValid()} className="w-full" size="lg">
                  Continue to Preview
                </Button>
                {!isFormValid() && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Please fill in all required fields including the event banner
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}