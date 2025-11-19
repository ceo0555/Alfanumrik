# 🎯 Pilot Program Setup Guide

## Quick Start (5 Minutes)

### Step 1: Environment Setup
```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd <project-directory>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Step 2: Access the Platform
1. Open browser to `http://localhost:5173`
2. You'll see the landing page
3. Click "Get Started" or navigate through the role selection

### Step 3: Access Pilot Dashboard
The Pilot Dashboard can be accessed by:

**Option A: Direct Component Import**
```typescript
import PilotDashboard from './components/school/PilotDashboard';

// Use in your App or routing
<PilotDashboard />
```

**Option B: Through School Role**
1. Select "School" role
2. Select any school administrator profile
3. Navigate to admin section

---

## 📥 Importing Student Data

### Method 1: CSV Bulk Import (Recommended for Pilot)

1. **Access Bulk Import**
   - Click "Bulk Import" button in Pilot Dashboard
   - Select "Students" or "Teachers"

2. **Download Template**
   ```csv
   name,grade
   John Doe,10
   Jane Smith,9
   Mike Johnson,11
   ```

3. **Prepare Your Data**
   - Fill in student information
   - One student per row
   - Grades: 1-12
   - Save as CSV file

4. **Upload and Import**
   - Click "Select File"
   - Choose your CSV file
   - Click "Import Data"
   - Review results

5. **Handle Errors**
   - Failed rows are listed with reasons
   - Fix data and re-import
   - Only failed rows need to be re-uploaded

### Method 2: Programmatic Import

```typescript
import { useAuth } from './contexts/AuthContext';
import { useSchool } from './contexts/SchoolContext';

const { handleSaveUser } = useAuth();
const { activeSchool } = useSchool();

// Import single student
handleSaveUser({
  name: 'John Doe',
  grade: '10',
  schoolId: activeSchool.id,
});

// Import multiple students
const students = [
  { name: 'Student 1', grade: '9' },
  { name: 'Student 2', grade: '10' },
  // ... more students
];

students.forEach(student => {
  handleSaveUser({
    ...student,
    schoolId: activeSchool.id,
  });
});
```

### Method 3: API Integration (Production)

For production deployment, create an API endpoint:

```typescript
// POST /api/schools/:schoolId/students/bulk
{
  "students": [
    { "name": "John Doe", "grade": "10", "email": "john@school.edu" },
    { "name": "Jane Smith", "grade": "9", "email": "jane@school.edu" }
  ]
}
```

---

## 🏫 School Configuration

### Adding a New School

```typescript
import { useSchool } from './contexts/SchoolContext';

const { addSchool } = useSchool();

addSchool({
  name: 'New International School',
  code: 'NIS',
  primaryColor: '#6366f1',
  secondaryColor: '#a855f7',
  address: '123 Education Street, City',
  contactEmail: 'admin@newschool.edu',
  contactPhone: '+91-123-456-7890',
  principalName: 'Dr. Principal Name',
  totalStudents: 5000,
  totalTeachers: 250,
  established: '2024',
  subscriptionTier: 'enterprise',
  subscriptionExpiry: '2025-12-31',
  isActive: true,
  settings: {
    allowParentAccess: true,
    enableAIFeatures: true,
    enableLMS: true,
    enableAssessments: true,
    maxStudentsPerClass: 40,
    academicYearStart: '2024-04-01',
    academicYearEnd: '2025-03-31',
    gradeSystem: 'percentage',
    attendanceRequired: true,
  },
});
```

### Editing School Settings

```typescript
const { updateSchool } = useSchool();

updateSchool('school-001', {
  primaryColor: '#3b82f6',
  secondaryColor: '#60a5fa',
  settings: {
    ...existingSettings,
    maxStudentsPerClass: 45,
  },
});
```

---

## 🎨 Customizing School Branding

### Via Branding Editor (UI)
1. Click "Branding" button
2. Select school from dropdown
3. Choose color theme:
   - Use presets (8 options)
   - Or pick custom colors
4. Upload logo (optional)
5. Preview in real-time
6. Click "Save Branding"

### Programmatically

```typescript
const { updateSchool } = useSchool();

// Update branding
updateSchool(schoolId, {
  primaryColor: '#1e40af',
  secondaryColor: '#3b82f6',
  logo: 'https://school.edu/logo.png',
});
```

---

## 📊 Monitoring the Pilot

### Health Checks

The system automatically runs 8 health checks:
1. Database Connection
2. Active Schools Status
3. User Load (< 55,000 users)
4. LMS Activity
5. Submission Processing
6. API Performance (< 300ms)
7. Error Rate (< 1%)
8. Storage Capacity (< 80%)

### Viewing Metrics

```typescript
import { useSchool } from './contexts/SchoolContext';

const { performanceMetrics, loadPerformanceMetrics } = useSchool();

// Metrics update every 30 seconds automatically
// Manual refresh:
loadPerformanceMetrics();

// Access metrics:
console.log(performanceMetrics.activeUsers);
console.log(performanceMetrics.apiResponseTime);
console.log(performanceMetrics.errorRate);
```

---

## 📈 Generating Reports

### Export School Report

1. Navigate to "Analytics & Reports" tab
2. Select period (week/month/year)
3. Review school comparison table
4. Click "Export Report"
5. CSV downloads automatically

### Custom Reports

```typescript
import { useSchool } from './contexts/SchoolContext';
import { useAuth } from './contexts/AuthContext';

const { schools } = useSchool();
const { userProfiles, allCourses, allSubmissions } = useAuth();

// Generate custom analytics
const report = schools.map(school => {
  const schoolUsers = userProfiles.filter(u => u.schoolId === school.id);
  const students = schoolUsers.filter(u => !u.schoolRole);
  
  return {
    schoolName: school.name,
    studentCount: students.length,
    // ... more metrics
  };
});

// Export to CSV
const csv = generateCSV(report);
downloadFile(csv, 'custom-report.csv');
```

---

## 🔒 Security Configuration

### Role-Based Access Control

```typescript
import { RBACService } from './utils/dataIsolation';

// Check permission
if (RBACService.hasPermission('teacher', 'manage_own_courses')) {
  // Allow action
}

// Check resource access
if (RBACService.canAccessResource('teacher', 'course', courseOwnerId, userId)) {
  // Allow access
}
```

### Data Isolation

```typescript
import { DataIsolationService } from './utils/dataIsolation';

// Filter users by school
const schoolUsers = DataIsolationService.filterUsersBySchool(
  allUsers,
  activeSchoolId
);

// Filter courses by school
const schoolCourses = DataIsolationService.filterCoursesBySchool(
  allCourses,
  allUsers,
  activeSchoolId
);

// Validate access
const hasAccess = DataIsolationService.validateAccess(
  userSchoolId,
  resourceSchoolId
);
```

### Audit Logging

```typescript
import { AuditLogger } from './utils/dataIsolation';

// Log action
AuditLogger.log(
  'user_login',
  userId,
  schoolId,
  { ipAddress: '192.168.1.1', timestamp: new Date() }
);

// View recent logs
const logs = AuditLogger.getRecentLogs(schoolId, 100);
```

---

## 🚨 Troubleshooting

### Issue: Bulk Import Failing

**Solution:**
1. Check CSV format matches template
2. Ensure no special characters in names
3. Verify grade values are 1-12
4. Check for duplicate entries
5. Review error messages in import results

### Issue: School Data Not Isolated

**Solution:**
1. Verify `schoolId` is set on all users
2. Check data filtering in components
3. Ensure `activeSchool` context is set
4. Review `DataIsolationService` usage

### Issue: Performance Degradation

**Solution:**
1. Check number of records in memory
2. Verify virtualization is active
3. Clear browser cache
4. Check network performance
5. Review console for errors

### Issue: Branding Not Applying

**Solution:**
1. Clear browser cache
2. Verify school context is active
3. Check if colors are valid hex codes
4. Refresh the page
5. Verify `updateSchool` is called

---

## 📊 Monitoring Dashboard

### Key Metrics to Watch

1. **Active Users**: Should grow daily
2. **Submission Rate**: Target 5+ per student/week
3. **API Response Time**: Keep below 300ms
4. **Error Rate**: Keep below 1%
5. **Course Creation**: Monitor teacher adoption

### Setting Up Alerts

```typescript
// Example: Alert if error rate is high
if (performanceMetrics.errorRate > 2) {
  console.error('High error rate detected!');
  // Send alert email/notification
}

// Alert if API is slow
if (performanceMetrics.apiResponseTime > 500) {
  console.warn('API response time degraded');
  // Trigger investigation
}
```

---

## 🎓 Training Checklist

### For Administrators
- [ ] Access Pilot Dashboard
- [ ] Review school statistics
- [ ] Perform bulk import
- [ ] Customize school branding
- [ ] Generate and export reports
- [ ] Monitor system health

### For Teachers
- [ ] Log in with teacher credentials
- [ ] Create a course
- [ ] Add content to course
- [ ] Enroll students (batch or individual)
- [ ] Create assignment
- [ ] Grade submissions

### For Students
- [ ] Log in with student credentials
- [ ] View enrolled courses
- [ ] Access course content
- [ ] Submit assignment
- [ ] Use AI tutor
- [ ] Check progress

---

## 📞 Support Contacts

### Technical Issues
- Email: tech-support@platform.com
- Response Time: 4 hours
- Available: 24/7

### Bulk Import Help
- Email: data-import@platform.com
- Response Time: 2 hours
- Available: Business hours

### Emergency Support
- Email: emergency@platform.com
- Phone: +1-XXX-XXX-XXXX
- Response Time: Immediate
- Available: 24/7

---

## 🎉 Ready to Launch!

Your pilot program is configured and ready. Follow this checklist:

- [x] Platform built successfully
- [x] 10 schools configured
- [x] Multi-tenancy enabled
- [x] Bulk import ready
- [x] Monitoring active
- [x] Reports available
- [ ] Import student data
- [ ] Train administrators
- [ ] Launch pilot
- [ ] Monitor daily

**Good luck with your pilot program!** 🚀
