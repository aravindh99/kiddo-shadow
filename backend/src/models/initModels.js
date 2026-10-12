// src/models/initModels.js
import db from "../config/db.js";

/* ===================== CORE ===================== */
import School from "../modules/schools/school.model.js";
import User from "../modules/users/user.model.js";

/* ===================== PEOPLE ===================== */
import Teacher from "../modules/teachers/teacher.model.js";
import Parent from "../modules/parents/parent.model.js";
import Student from "../modules/students/student.model.js";
import TeacherClassSession from "../modules/teacher-class-sessions/teacher-class-session.model.js";
import TeacherAssignment from "../modules/teacher-assignments/teacher-assignment.model.js";
import AITestAssignment from "../modules/ai-test-assignments/ai-test-assignment.model.js";
import AITestSubmission from "../modules/ai-test-assignments/ai-test-submission.model.js";




/* ===================== ACADEMICS ===================== */
import Class from "../modules/classes/classes.model.js";
import Subject from "../modules/subjects/subject.model.js";
import Timetable from "../modules/timetables/timetable.model.js";
import Section from "../modules/sections/section.model.js";

//homework
import Homework from "../modules/homework/homework.model.js";
import HomeworkSubmission from "../modules/homework/homework-submission.model.js";
import HomeworkReadStatus from "../modules/homework/homework-read-status.model.js";


/* ===================== ACTIVITY ===================== */
import Attendance from "../modules/attendance/attendance.model.js";

/* ===================== QUIZ / GAME ===================== */
import Quiz from "../modules/quiz/quiz.model.js";
import QuizQuestion from "../modules/quiz/quiz-question.model.js";
import GameSession from "../modules/game/game-session.model.js";
import GameSessionPlayer from "../modules/game/game-session-player.model.js";
import PlayerAnswer from "../modules/game/player-answer.model.js";

/* ===================== AI / LOGS ===================== */
import AiChatLog from "../modules/ai-chat-logs/ai-chat-log.model.js";
import AiChatConversation from "../modules/ai-chat/ai-chat-conversation.model.js";
import AiChatMessage from "../modules/ai-chat/ai-chat-message.model.js";
import VoiceLog from "../modules/voice-logs/voice-log.model.js";
import AuditLog from "../modules/audit/audit-log.model.js";

/* ===================== TOKENS / BILLING ===================== */
import Subscription from "../modules/subscriptions/subscription.model.js";
import BillingReference from "../modules/billing/billing-reference.model.js";
import BillingInvoice from "../modules/billing/billing-invoice.model.js";
import TokenAccount from "../modules/tokens/token-account.model.js";
import TokenTransaction from "../modules/tokens/token-transaction.model.js";
import TokenPolicy from "../modules/tokens/token-policy.model.js";

/* ===================== REPORT CARDS ===================== */
import Exam from "../modules/report-cards/exam.model.js";
import ExamTimetable from "../modules/report-cards/exam-timetable.model.js";
import ReportCard from "../modules/report-cards/report-card.model.js";
import ReportCardMark from "../modules/report-cards/report-card-mark.model.js";

/* ===================== MISC ===================== */
import Notification from "../modules/notifications/notification.model.js";
import NotificationAck from "../modules/notifications/notification-ack.model.js";
import PaymentLog from "../modules/payment-logs/payment-log.model.js";

/* ===================== GROUP CHAT ===================== */
import GroupChat from "../modules/group-chat/group-chat.model.js";
import GroupChatMember from "../modules/group-chat/group-chat-member.model.js";
import GroupChatMessage from "../modules/group-chat/group-chat-message.model.js";

/* ===================== SETTINGS ===================== */
import SystemSetting from "../modules/settings/setting.model.js";

const initAssociations = () => {
  /* ==================== SCHOOL ==================== */
  School.hasMany(User, { foreignKey: "school_id" });
  School.hasMany(Class, { foreignKey: "school_id" });
  School.hasMany(Teacher, { foreignKey: "school_id" });
  School.hasMany(Student, { foreignKey: "school_id" });
  School.hasMany(Section, { foreignKey: "school_id" });
  School.hasMany(PaymentLog, { foreignKey: "school_id" });

  User.belongsTo(School, { foreignKey: "school_id" });
  Section.belongsTo(School, { foreignKey: "school_id" });
  PaymentLog.belongsTo(School, { foreignKey: "school_id" });

  /* ==================== USER PROFILES ==================== */
  User.hasOne(Student, { foreignKey: "user_id" });
  Student.belongsTo(User, { foreignKey: "user_id" });

  User.hasOne(Teacher, { foreignKey: "user_id" });
  Teacher.belongsTo(User, { foreignKey: "user_id" });

  User.hasOne(Parent, { foreignKey: "user_id" });
  Parent.belongsTo(User, { foreignKey: "user_id" });

  /* ==================== STUDENT (LEGACY – KEEP) ==================== */
  Student.belongsTo(School, { foreignKey: "school_id" });
  Student.belongsTo(Class, {
    foreignKey: "class_id",
    onDelete: "SET NULL",
  });
  Student.belongsTo(Section, { foreignKey: "section_id" });
  Student.hasMany(PaymentLog, { foreignKey: "student_id" });
  PaymentLog.belongsTo(Student, { foreignKey: "student_id" });

  Class.hasMany(Student, { foreignKey: "class_id" });
  Class.hasMany(PaymentLog, { foreignKey: "class_id" });
  PaymentLog.belongsTo(Class, { foreignKey: "class_id" });
  Section.hasMany(Student, { foreignKey: "section_id" });
  Section.hasMany(PaymentLog, { foreignKey: "section_id" });
  PaymentLog.belongsTo(Section, { foreignKey: "section_id" });

  Student.hasMany(Attendance, { foreignKey: "student_id" });

  /* ==================== REPORT CARDS ==================== */
  Exam.belongsTo(School, { foreignKey: "school_id" });
  Exam.belongsTo(Class, { foreignKey: "class_id" });
  Exam.hasMany(ReportCard, { foreignKey: "exam_id" });
  
  Exam.hasMany(ExamTimetable, { foreignKey: "exam_id", onDelete: "CASCADE" });
  ExamTimetable.belongsTo(Exam, { foreignKey: "exam_id" });
  ExamTimetable.belongsTo(Subject, { foreignKey: "subject_id" });

  ReportCard.belongsTo(School, { foreignKey: "school_id" });
  ReportCard.belongsTo(Student, { foreignKey: "student_id" });
  ReportCard.belongsTo(Class, { foreignKey: "class_id" });
  ReportCard.belongsTo(Exam, { foreignKey: "exam_id" });
  ReportCard.hasMany(ReportCardMark, {
    foreignKey: "report_card_id",
    onDelete: "CASCADE",
  });

  ReportCardMark.belongsTo(ReportCard, {
    foreignKey: "report_card_id",
  });

  ReportCardMark.belongsTo(Subject, {
    foreignKey: "subject_id",
  });


  /* ==================== STUDENT ↔ PARENT ==================== */
  Student.hasMany(Parent, { foreignKey: "student_id" });
  Parent.belongsTo(Student, { foreignKey: "student_id" });

  /* ==================== TEACHER CLASS SESSION ==================== */
  TeacherClassSession.belongsTo(School, { foreignKey: "school_id" });
  TeacherClassSession.belongsTo(TeacherAssignment, { foreignKey: "teacher_assignment_id" });
  TeacherClassSession.belongsTo(Timetable, { foreignKey: "timetable_id" });
  TeacherClassSession.belongsTo(Teacher, { foreignKey: "teacher_id" });
  TeacherClassSession.belongsTo(Class, { foreignKey: "class_id" });
  TeacherClassSession.belongsTo(Section, { foreignKey: "section_id" });

  // Reverse associations
  TeacherAssignment.hasMany(TeacherClassSession, { foreignKey: "teacher_assignment_id" });
  Timetable.hasMany(TeacherClassSession, { foreignKey: "timetable_id" });

  /* ==================== TEACHER ==================== */
  Teacher.belongsTo(School, { foreignKey: "school_id" });
  Teacher.belongsTo(User, { foreignKey: "user_id" });
  Teacher.hasMany(Class, { foreignKey: "class_teacher_id" });
  Teacher.hasMany(TeacherAssignment, { foreignKey: "teacher_id" });
  Teacher.hasMany(AITestAssignment, { foreignKey: "teacher_id" });


  /* ==================== ATTENDANCE ==================== */
  Attendance.belongsTo(School, { foreignKey: "school_id" });
  Attendance.belongsTo(Class, { foreignKey: "class_id" });
  Attendance.belongsTo(Section, { foreignKey: "section_id" });
  Attendance.belongsTo(Student, { foreignKey: "student_id" });
  Attendance.belongsTo(TeacherClassSession, { foreignKey: "teacher_class_session_id" });
  Attendance.belongsTo(User, { foreignKey: "marked_by" });

  // Reverse associations
  Student.hasMany(Attendance, { foreignKey: "student_id" });
  Student.hasMany(AITestSubmission, { foreignKey: "student_id" });
  TeacherClassSession.hasMany(Attendance, { foreignKey: "teacher_class_session_id" });

  /* ==================== CLASS ==================== */
  Class.belongsTo(School, { foreignKey: "school_id" });
  Class.belongsTo(Teacher, { foreignKey: "class_teacher_id" });
  Class.hasMany(Attendance, { foreignKey: "class_id" });
  Class.hasMany(Section, { foreignKey: "class_id" });
  Class.hasMany(Timetable, { foreignKey: "class_id" });
  Class.hasMany(AITestAssignment, { foreignKey: "class_id" });

  /* ==================== SUBJECT ==================== */
  Subject.belongsTo(School, { foreignKey: "school_id" });

  /* ==================== SECTION ==================== */
  Section.hasMany(Timetable, { foreignKey: "section_id" });
  Section.hasMany(Attendance, { foreignKey: "section_id" });
  Section.hasMany(AITestAssignment, { foreignKey: "section_id" });

  /* ==================== TEACHER ASSIGNMENTS ==================== */
  TeacherAssignment.belongsTo(Teacher, { foreignKey: "teacher_id" });
  TeacherAssignment.belongsTo(Class, { foreignKey: "class_id" });
  TeacherAssignment.belongsTo(Section, { foreignKey: "section_id" });
  TeacherAssignment.belongsTo(Subject, { foreignKey: "subject_id" });
  TeacherAssignment.hasMany(Timetable, {
    foreignKey: "teacher_assignment_id",
  });

  /* ==================== AI TEST ASSIGNMENTS ==================== */
  AITestAssignment.belongsTo(School, { foreignKey: "school_id" });
  AITestAssignment.belongsTo(Teacher, { foreignKey: "teacher_id" });
  AITestAssignment.belongsTo(Class, { foreignKey: "class_id" });
  AITestAssignment.belongsTo(Section, { foreignKey: "section_id" });
  AITestAssignment.belongsTo(Subject, { foreignKey: "subject_id" });
  AITestAssignment.hasMany(AITestSubmission, {
    foreignKey: "assignment_id",
    onDelete: "CASCADE",
  });

  AITestSubmission.belongsTo(School, { foreignKey: "school_id" });
  AITestSubmission.belongsTo(AITestAssignment, { foreignKey: "assignment_id" });
  AITestSubmission.belongsTo(Student, { foreignKey: "student_id" });

  /* ==================== TIMETABLE ==================== */
  Timetable.belongsTo(Class, { foreignKey: "class_id" });
  Timetable.belongsTo(Section, { foreignKey: "section_id" });
  Timetable.belongsTo(TeacherAssignment, { foreignKey: "teacher_assignment_id" });


  /* ==================== CHAPTER / TOPIC (REMOVED - UNUSED) ==================== */

  /* ==================== QUIZ / GAME ==================== */
  Quiz.belongsTo(User, { foreignKey: "owner_user_id" });
  Quiz.hasMany(QuizQuestion, { foreignKey: "quiz_id" });

  QuizQuestion.belongsTo(Quiz, { foreignKey: "quiz_id" });

  GameSession.belongsTo(Quiz, { foreignKey: "quiz_id" });
  GameSession.belongsTo(User, { foreignKey: "host_user_id" });
  GameSession.hasMany(GameSessionPlayer, { foreignKey: "session_id" });

  GameSessionPlayer.belongsTo(GameSession, { foreignKey: "session_id" });
  GameSessionPlayer.belongsTo(User, { foreignKey: "user_id" });
  GameSessionPlayer.hasMany(PlayerAnswer, {
    foreignKey: "session_player_id",
  });

  PlayerAnswer.belongsTo(GameSessionPlayer, {
    foreignKey: "session_player_id",
  });
  PlayerAnswer.belongsTo(QuizQuestion, { foreignKey: "question_id" });

  /* ==================== AI / LOGS ==================== */
  AiChatLog.belongsTo(User, { foreignKey: "user_id" });
  User.hasMany(AiChatConversation, { foreignKey: "user_id" });
  AiChatConversation.belongsTo(User, { foreignKey: "user_id" });
  AiChatConversation.hasMany(AiChatMessage, { foreignKey: "conversation_id" });
  AiChatMessage.belongsTo(AiChatConversation, { foreignKey: "conversation_id" });
  User.hasMany(AiChatMessage, { foreignKey: "user_id" });
  AiChatMessage.belongsTo(User, { foreignKey: "user_id" });
  VoiceLog.belongsTo(User, { foreignKey: "user_id" });
  AuditLog.belongsTo(User, { foreignKey: "performed_by" });
  User.hasMany(AuditLog, { foreignKey: "performed_by" });


  /* ==================== HOMEWORK ==================== */
  Homework.belongsTo(Class, { foreignKey: "class_id" });
  Homework.belongsTo(Section, { foreignKey: "section_id" });
  Homework.belongsTo(Subject, { foreignKey: "subject_id" });
  Homework.belongsTo(TeacherAssignment, { foreignKey: "teacher_assignment_id" });
  Homework.belongsTo(User, { foreignKey: "created_by" });
  Homework.hasMany(HomeworkSubmission, { foreignKey: "homework_id" });

  // Reverse associations
  Class.hasMany(Homework, { foreignKey: "class_id" });
  Section.hasMany(Homework, { foreignKey: "section_id" });
  TeacherAssignment.hasMany(Homework, { foreignKey: "teacher_assignment_id" });
  HomeworkSubmission.belongsTo(Homework, { foreignKey: "homework_id" });
  HomeworkSubmission.belongsTo(Student, { foreignKey: "student_id" });

  Homework.hasMany(HomeworkSubmission, {
    foreignKey: "homework_id",
    onDelete: "CASCADE",
  });

  Homework.hasMany(HomeworkReadStatus, { foreignKey: "homework_id", onDelete: "CASCADE" });
  HomeworkReadStatus.belongsTo(Homework, { foreignKey: "homework_id" });

  Student.hasMany(HomeworkReadStatus, { foreignKey: "student_id", onDelete: "CASCADE" });
  HomeworkReadStatus.belongsTo(Student, { foreignKey: "student_id" });


  /* ==================== TOKENS ==================== */
  Subscription.belongsTo(School, { foreignKey: "school_id" });
  BillingInvoice.belongsTo(School, { foreignKey: "school_id" });
  School.hasMany(BillingInvoice, { foreignKey: "school_id" });
  TokenAccount.belongsTo(User, { foreignKey: "user_id" });
  TokenTransaction.belongsTo(User, { foreignKey: "user_id" });
  TokenPolicy.belongsTo(User, { foreignKey: "updated_by" });

  /* ==================== NOTIFICATIONS ==================== */
  Notification.belongsTo(User, { foreignKey: "sender_user_id" });
  Notification.belongsTo(School, { foreignKey: "school_id" });
  Notification.belongsTo(Class, { foreignKey: "class_id" });
  NotificationAck.belongsTo(Notification, {
    foreignKey: "notification_id",
    onDelete: "CASCADE",
  });

  Notification.hasMany(NotificationAck, {
    foreignKey: "notification_id",
  });

  /* ==================== GROUP CHAT ==================== */
  GroupChat.hasMany(GroupChatMember, { foreignKey: "group_chat_id" });
  GroupChatMember.belongsTo(GroupChat, { foreignKey: "group_chat_id" });

  GroupChatMember.belongsTo(User, { foreignKey: "user_id" });

  GroupChat.belongsTo(User, { foreignKey: "teacher_id", as: "Teacher" });
  GroupChat.belongsTo(Subject, { foreignKey: "subject_id" });
  GroupChat.belongsTo(Class, { foreignKey: "class_id" });
  GroupChat.belongsTo(Section, { foreignKey: "section_id" });

  GroupChat.hasMany(GroupChatMessage, { foreignKey: "group_chat_id" });
  GroupChatMessage.belongsTo(GroupChat, { foreignKey: "group_chat_id" });
  GroupChatMessage.belongsTo(User, { foreignKey: "sender_user_id", as: "Sender" });
};

initAssociations();

export default db;
