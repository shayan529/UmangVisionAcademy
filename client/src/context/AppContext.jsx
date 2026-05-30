import { createContext, useContext, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { login as loginAction, register as registerAction, logout as logoutAction } from "../redux/slices/authSlice"
import { fetchUsers as fetchUsersAction, fetchUserById as fetchUserByIdAction, updateUser as updateUserAction, deleteUser as deleteUserAction } from "../redux/slices/usersSlice"
import {
  fetchCourses as fetchCoursesAction,
  fetchCourseById as fetchCourseByIdAction,
  createCourse as createCourseAction,
  updateCourse as updateCourseAction,
  deleteCourse as deleteCourseAction,
  clearCourseError,
  clearCourseSuccess,
  clearSelectedCourse,
} from "../redux/slices/courseSlice"

const AppContext = createContext()

export const AppProvider = ({ children }) => {
  const dispatch = useDispatch()

  const { user, loading: authLoading, error: authError, isAuthenticated } = useSelector((state) => state.auth)
  const {
    courses,
    selectedCourse,
    loading: courseLoading,
    detailLoading: courseDetailLoading,
    error: courseError,
    success: courseSuccess,
  } = useSelector((state) => state.courses)

  // ── Auth ────────────────────────────────────────────────────────────────

  const login = async (credentials) => {
    const result = await dispatch(loginAction(credentials))
    if (result.payload) return result.payload
    throw new Error(result.payload || "Login failed")
  }

  const register = async (values) => {
    const result = await dispatch(registerAction(values))
    if (result.payload) return result.payload
    throw new Error(result.payload || "Registration failed")
  }

  const logout = () => dispatch(logoutAction())

  // ── Users ───────────────────────────────────────────────────────────────

  const fetchUsers = async () => {
    const result = await dispatch(fetchUsersAction())
    return result.payload
  }

  const fetchUserById = async (id) => {
    const result = await dispatch(fetchUserByIdAction(id))
    return result.payload
  }

  const updateUser = async (id, payload) => {
    const result = await dispatch(updateUserAction({ id, payload }))
    return result.payload
  }

  const deleteUser = async (id) => {
    const result = await dispatch(deleteUserAction(id))
    return result.payload
  }

  // ── Courses ─────────────────────────────────────────────────────────────

  const fetchCourses = async () => {
    const result = await dispatch(fetchCoursesAction())
    return result.payload
  }

  const fetchCourseById = async (id) => {
    const result = await dispatch(fetchCourseByIdAction(id))
    return result.payload
  }

  const createCourse = async (courseData) => {
    const result = await dispatch(createCourseAction(courseData))
    if (result.payload) return result.payload
    throw new Error(result.payload || "Failed to create course")
  }

  const updateCourse = async (id, courseData) => {
    const result = await dispatch(updateCourseAction({ id, courseData }))
    if (result.payload) return result.payload
    throw new Error(result.payload || "Failed to update course")
  }

  const deleteCourse = async (id) => {
    const result = await dispatch(deleteCourseAction(id))
    return result.payload
  }

  const clearCourseState = () => {
    dispatch(clearCourseError())
    dispatch(clearCourseSuccess())
  }

  const resetSelectedCourse = () => dispatch(clearSelectedCourse())

  // ── Context value ────────────────────────────────────────────────────────

  const value = useMemo(
    () => ({
      // auth state
      user,
      authLoading,
      authError,
      isAuthenticated,

      // auth actions
      login,
      register,
      logout,

      // user actions
      fetchUsers,
      fetchUserById,
      updateUser,
      deleteUser,

      // course state
      courses,
      selectedCourse,
      courseLoading,
      courseDetailLoading,
      courseError,
      courseSuccess,

      // course actions
      fetchCourses,
      fetchCourseById,
      createCourse,
      updateCourse,
      deleteCourse,
      clearCourseState,
      resetSelectedCourse,
    }),
    [user, authLoading, authError, isAuthenticated, courses, selectedCourse, courseLoading, courseDetailLoading, courseError, courseSuccess]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)