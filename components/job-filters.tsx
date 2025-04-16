"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { collection, getDocs, query } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Search, X, Filter } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

interface FilterOption {
  id: string
  label: string
  count?: number
}

interface JobFiltersProps {
  onFilterChange: (filters: JobFilters) => void
  className?: string
}

export interface JobFilters {
  type: string
  location: string[]
  keyword: string
}

export default function JobFilters({ onFilterChange, className }: JobFiltersProps) {
  const [filters, setFilters] = useState<JobFilters>({
    type: "",
    location: [],
    keyword: "",
  })

  const [locations, setLocations] = useState<FilterOption[]>([])
  const [categories, setCategories] = useState<FilterOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilterCount, setActiveFilterCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  // Fetch filter options from Firestore
  useEffect(() => {
    async function fetchFilterOptions() {
      setIsLoading(true)
      try {
        // Get unique locations
        const locationsMap = new Map<string, number>()
        const categoriesMap = new Map<string, number>()

        const jobsQuery = query(collection(db, "jobs"))
        const snapshot = await getDocs(jobsQuery)

        snapshot.forEach((doc) => {
          const job = doc.data()

          // Count locations
          if (job.location) {
            const count = locationsMap.get(job.location) || 0
            locationsMap.set(job.location, count + 1)
          }

          // Count categories
          if (job.category) {
            const count = categoriesMap.get(job.category) || 0
            categoriesMap.set(job.category, count + 1)
          }
        })

        // Convert maps to arrays
        setLocations(
          Array.from(locationsMap.entries()).map(([label, count]) => ({
            id: label.toLowerCase().replace(/\s+/g, "-"),
            label,
            count,
          })),
        )

        setCategories(
          Array.from(categoriesMap.entries()).map(([label, count]) => ({
            id: label.toLowerCase().replace(/\s+/g, "-"),
            label,
            count,
          })),
        )
      } catch (error) {
        console.error("Error fetching filter options:", error)
        // Fallback with sample data if Firestore fetch fails
        setLocations([
          { id: "remote", label: "Remote", count: 24 },
          { id: "new-york", label: "New York", count: 18 },
          { id: "london", label: "London", count: 12 },
          { id: "paris", label: "Paris", count: 8 },
          { id: "berlin", label: "Berlin", count: 6 },
        ])

        setCategories([
          { id: "it", label: "IT", count: 35 },
          { id: "marketing", label: "Marketing", count: 22 },
          { id: "design", label: "Design", count: 19 },
          { id: "sales", label: "Sales", count: 14 },
          { id: "finance", label: "Finance", count: 10 },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchFilterOptions()
  }, [])

  // Update active filter count
  useEffect(() => {
    let count = 0
    if (filters.type) count++
    count += filters.location.length
    if (filters.keyword) count++
    setActiveFilterCount(count)
  }, [filters])

  // Handle type selection (radio button)
  const handleTypeChange = (value: string) => {
    setFilters({ ...filters, type: value })
  }

  // Handle location selection (checkboxes)
  const handleLocationChange = (locationId: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      location: checked ? [...prev.location, locationId] : prev.location.filter((id) => id !== locationId),
    }))
  }

  // Handle keyword search
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, keyword: e.target.value })
  }

  // Apply filters
  const applyFilters = () => {
    onFilterChange(filters)
    setIsOpen(false)
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      type: "",
      location: [],
      keyword: "",
    })
    onFilterChange({
      type: "",
      location: [],
      keyword: "",
    })
  }

  // Desktop filter view
  const DesktopFilters = () => (
    <div className={`hidden md:block rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium">Filters</h2>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs">
            <X className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Keyword search */}
        <div className="space-y-2">
          <Label htmlFor="desktop-keyword">Keyword</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="desktop-keyword"
              placeholder="Job title, skills, etc."
              className="pl-8"
              value={filters.keyword}
              onChange={handleKeywordChange}
            />
          </div>
        </div>

        {/* Job Type */}
        <div className="space-y-2">
          <Label>Job Type</Label>
          <RadioGroup value={filters.type} onValueChange={handleTypeChange} className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Full-Time" id="desktop-full-time" />
              <Label htmlFor="desktop-full-time" className="text-sm font-normal cursor-pointer">
                Full-Time
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Part-Time" id="desktop-part-time" />
              <Label htmlFor="desktop-part-time" className="text-sm font-normal cursor-pointer">
                Part-Time
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Contract" id="desktop-contract" />
              <Label htmlFor="desktop-contract" className="text-sm font-normal cursor-pointer">
                Contract
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Remote" id="desktop-remote" />
              <Label htmlFor="desktop-remote" className="text-sm font-normal cursor-pointer">
                Remote
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Location */}
        <Accordion type="single" collapsible defaultValue="location">
          <AccordionItem value="location" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="text-sm font-medium">Location</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading locations...</div>
                ) : locations.length > 0 ? (
                  locations.map((location) => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`desktop-location-${location.id}`}
                        checked={filters.location.includes(location.id)}
                        onCheckedChange={(checked) => handleLocationChange(location.id, checked as boolean)}
                      />
                      <Label
                        htmlFor={`desktop-location-${location.id}`}
                        className="text-sm font-normal cursor-pointer flex justify-between w-full"
                      >
                        <span>{location.label}</span>
                        <span className="text-muted-foreground">({location.count})</span>
                      </Label>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No locations available</div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button onClick={applyFilters} className="w-full">
          Apply Filters
        </Button>
      </div>
    </div>
  )

  // Mobile filter view (in a sheet)
  const MobileFilters = () => (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] pt-6">
          <SheetHeader>
            <SheetTitle>Filter Jobs</SheetTitle>
            <SheetDescription>Narrow down your job search with filters</SheetDescription>
          </SheetHeader>
          <div className="space-y-6 py-4 overflow-y-auto h-[calc(100%-10rem)]">
            {/* Keyword search */}
            <div className="space-y-2">
              <Label htmlFor="mobile-keyword">Keyword</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="mobile-keyword"
                  placeholder="Job title, skills, etc."
                  className="pl-8"
                  value={filters.keyword}
                  onChange={handleKeywordChange}
                />
              </div>
            </div>

            {/* Job Type */}
            <div className="space-y-2">
              <Label>Job Type</Label>
              <RadioGroup value={filters.type} onValueChange={handleTypeChange} className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Full-Time" id="mobile-full-time" />
                  <Label htmlFor="mobile-full-time" className="text-sm font-normal cursor-pointer">
                    Full-Time
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Part-Time" id="mobile-part-time" />
                  <Label htmlFor="mobile-part-time" className="text-sm font-normal cursor-pointer">
                    Part-Time
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Contract" id="mobile-contract" />
                  <Label htmlFor="mobile-contract" className="text-sm font-normal cursor-pointer">
                    Contract
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Remote" id="mobile-remote" />
                  <Label htmlFor="mobile-remote" className="text-sm font-normal cursor-pointer">
                    Remote
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading locations...</div>
                ) : locations.length > 0 ? (
                  locations.map((location) => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`mobile-location-${location.id}`}
                        checked={filters.location.includes(location.id)}
                        onCheckedChange={(checked) => handleLocationChange(location.id, checked as boolean)}
                      />
                      <Label
                        htmlFor={`mobile-location-${location.id}`}
                        className="text-sm font-normal cursor-pointer flex justify-between w-full"
                      >
                        <span>{location.label}</span>
                        <span className="text-muted-foreground">({location.count})</span>
                      </Label>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No locations available</div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {activeFilterCount > 0 && (
              <Button variant="outline" onClick={clearFilters} className="flex-1">
                Clear all
              </Button>
            )}
            <Button onClick={applyFilters} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )

  // Active filters display
  const ActiveFilters = () => {
    if (activeFilterCount === 0) return null

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {filters.type && (
          <Badge variant="secondary" className="flex items-center gap-1">
            {filters.type}
            <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters({ ...filters, type: "" })} />
          </Badge>
        )}

        {filters.location.map((loc) => {
          const location = locations.find((l) => l.id === loc)
          return (
            <Badge key={loc} variant="secondary" className="flex items-center gap-1">
              {location?.label || loc}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleLocationChange(loc, false)} />
            </Badge>
          )
        })}

        {filters.keyword && (
          <Badge variant="secondary" className="flex items-center gap-1">
            "{filters.keyword}"
            <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters({ ...filters, keyword: "" })} />
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div>
      <DesktopFilters />
      <MobileFilters />
      <ActiveFilters />
    </div>
  )
}

