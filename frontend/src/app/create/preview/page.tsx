"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/dashboard/sidebar"
import { useRouter } from "next/navigation"

interface EventFormData {
  eventName: string
  eventDescription: string
  location: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  bannerPreview: string | null
}

export default function PreviewEventPage() {
  const router = useRouter()
  const [eventData, setEventData] = useState<EventFormData | null>(null)
  const [ticketType, setTicketType] = useState("free")
  const [regularPrice, setRegularPrice] = useState("")
  const [vipPrice, setVipPrice] = useState("")

  useEffect(() => {
    const storedData = localStorage.getItem("eventFormData")
    if (storedData) {
      setEventData(JSON.parse(storedData))
    } else {
      router.push("/create")
    }
  }, [router])

  const handlePublish = () => {
    // In a real app, this would make an API call to create the event
    const eventToPublish = {
      ...eventData,
      ticketType,
      regularPrice: ticketType === "paid" ? regularPrice : null,
      vipPrice: ticketType === "paid" ? vipPrice : null,
    }

    console.log("Publishing event:", eventToPublish)

    // Clear stored data
    localStorage.removeItem("eventFormData")

    // Redirect to success page or dashboard
    alert("Event published successfully!")
    router.push("/dashboard")
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  if (!eventData) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Loading event preview...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Event Preview</h1>
            <p className="text-muted-foreground">Review your event details and set ticket pricing</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Event Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent>
                {eventData.bannerPreview && (
                  <img
                    src={eventData.bannerPreview || "/placeholder.svg"}
                    alt="Event banner"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <h2 className="text-2xl font-bold mb-2">{eventData.eventName}</h2>
                <p className="text-muted-foreground mb-4">{eventData.eventDescription}</p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2"
                      />
                    </svg>
                    <div>
                      <p className="font-medium">Start: {formatDate(eventData.startDate)}</p>
                      <p className="text-sm text-muted-foreground">{formatTime(eventData.startTime)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2"
                      />
                    </svg>
                    <div>
                      <p className="font-medium">End: {formatDate(eventData.endDate)}</p>
                      <p className="text-sm text-muted-foreground">{formatTime(eventData.endTime)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p className="font-medium">{eventData.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup value={ticketType} onValueChange={setTicketType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="free" id="free" />
                    <Label htmlFor="free" className="flex-1">
                      <div>
                        <p className="font-medium">Free Event</p>
                        <p className="text-sm text-muted-foreground">No charge for attendees</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paid" id="paid" />
                    <Label htmlFor="paid" className="flex-1">
                      <div>
                        <p className="font-medium">Paid Event</p>
                        <p className="text-sm text-muted-foreground">Set prices for different ticket types</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {ticketType === "paid" && (
                  <div className="space-y-4 pl-6 border-l-2 border-primary">
                    <div className="space-y-2">
                      <Label htmlFor="regularPrice">Regular Ticket Price (ETH)</Label>
                      <Input
                        id="regularPrice"
                        placeholder="0.05"
                        value={regularPrice}
                        onChange={(e) => setRegularPrice(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vipPrice">VIP Ticket Price (ETH)</Label>
                      <Input
                        id="vipPrice"
                        placeholder="0.1"
                        value={vipPrice}
                        onChange={(e) => setVipPrice(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 space-y-3">
                  <Button onClick={handlePublish} className="w-full" size="lg">
                    Publish Event
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/create")} className="w-full">
                    Back to Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
