const r = require('rethinkdb');
const io = require('socket.io')();
const fetch = require('node-fetch');

let currentConnections = {};

function subscribeToClassroomLessonSession({
  connection,
  client,
  classroomLessonSessionId
}) {
  r.table('classroom_lesson_sessions')
  .get(classroomLessonSessionId)
  .changes({ includeInitial: true })
  .run(connection, (err, cursor) => {
    cursor.each((err, document) => {
      if (err) throw err
      let session = document.new_val;
      if (session) {
        client.emit(`classroomLessonSession:${session.id}`, session)
      }
    });
  });
}

function createPreviewSession({ connection, previewSessionData }) {
  r.table('classroom_lesson_sessions')
  .insert(previewSessionData)
  .run(connection)
}

function subscribeToCurrentSlide({
  connection,
  client,
  classroomActivityId
}) {
  r.table('classroom_lesson_sessions')
  .get(classroomActivityId)
  .getField('current_slide')
  .run(connection)
  .then((currentSlide) => {
    client.emit(`currentSlide:${classroomActivityId}`, currentSlide)
  });
}

function updateClassroomLessonSession({ connection, session }) {
  r.table('classroom_lesson_sessions')
  .insert(session, { conflict: 'update' })
  .run(connection);
}

function createOrUpdateClassroomLessonSession({
  connection,
  classroomActivityId
}) {
  const url = process.env.EMPIRICAL_BASE_URL +
    '/api/v1/classroom_activities/' +
    classroomActivityId +
    '/classroom_teacher_and_coteacher_ids'

  r.table('classroom_lesson_sessions')
  .get(classroomActivityId)
  .run(connection)
  .then((session) => {
    fetch(url, {
      method: "GET",
      mode: "cors",
      credentials: 'include',
    }).then(response => {
      if (!response.ok) {
        console.log(response.statusText)
      } else {
        return response.json()
      }
    }).then(response => {
      response ? session.teacher_ids = response.teacher_ids : undefined;
      session.current_slide = session && session.current_slide ? session.current_slide : 0;
      session.startTime = session && session.startTime ? session.startTime : new Date();
      session.id = session && session.id ? session.id : classroomActivityId;

      r.table('classroom_lesson_sessions')
      .insert(session, { conflict: 'replace' })
      .run(connection)
    });
  });
}

function teacherConnected({
  classroomActivityId,
  connection,
  client,
}) {
  let session = { id: classroomActivityId, absentTeacherState: false };
  currentConnections[client.id].role = 'teacher';
  currentConnections[client.id].classroomActivityId = classroomActivityId;

  updateClassroomLessonSession({
    connection,
    session,
  });
}

function disconnect({
  client,
  connection,
}) {
  if (currentConnections[client.id].role === 'teacher') {
    let session = {
      id: currentConnections[client.id].classroomActivityId,
      absentTeacherState: true
    };

    updateClassroomLessonSession({
      connection,
      session,
    });
  }

  if (currentConnections[client.id].role === 'student') {
    let session = {
      id: currentConnections[client.id].classroomActivityId,
      presence: {}
    };
    session['presence'][currentConnections[client.id].studentId] = false

    updateClassroomLessonSession({
      connection,
      session,
    });
  }

  delete currentConnections[client.id];
}

function registerPresence({
  connection,
  classroomActivityId,
  studentId,
  client,
}) {
  let session = { id: classroomActivityId, presence: {} }
  currentConnections[client.id].role = 'student';
  currentConnections[client.id].studentId = studentId;
  currentConnections[client.id].classroomActivityId = classroomActivityId;
  session.presence[studentId] = true;

  updateClassroomLessonSession({
    session,
    connection,
  });
}

function setSlideStartTime({
  classroomActivityId,
  questionId,
  connection,
}) {
  let session = { id: classroomActivityId, timestamps: {} };

  r.table('classroom_lesson_sessions')
  .get(classroomActivityId)('submissions')(questionId.toString())
  .changes({ includeInitial: true })
  .run(connection)
  .catch(() => {
    session['timestamps'][questionId.toString()] = new Date();
    updateClassroomLessonSession({
      session,
      connection,
    });
  });
}

function addStudent({
  connection,
  client,
  classroomActivityId,
  studentName,
}) {
  const nameRef = studentName.replace(/\s/g, '').toLowerCase()

  r.table('classroom_lesson_sessions')
  .get(classroomActivityId)
  .update((classroomActivity) => {
    let students = {};

    if (!classroomActivity.students) {
      students = { students: {} };
    } else {
      students = { students: classroomActivity['students'] };
    }
    students['students'][nameRef] = studentName;
    return students;
  })
  .run(connection)
  .then(() => {
    client.emit(`studentAdded:${classroomActivityId}`, studentName, nameRef)
  });
}

function saveStudentSubmission({
  classroomActivityId,
  connection,
  questionId,
  studentId,
  submission,
}) {
  let session = {
    id: classroomActivityId,
    submissions: {}
  };
  session['submissions'][questionId] = {};
  session['submissions'][questionId][studentId] = submission;

  updateClassroomLessonSession({
    session,
    connection,
  });
}

function removeStudentSubmission({
  classroomActivityId,
  connection,
  questionId,
  studentId,
}) {
  r.table('classroom_lesson_sessions')
  .get(classroomActivityId).replace(r.row.without({
    submissions: { [questionId]: { [studentId]: true } }
  }))
  .run(connection)
}

function removeMode({
  connection,
  classroomActivityId,
  questionId,
}) {
  r.table('classroom_lesson_sessions')
  .get(classroomActivityId)
  .replace(r.row.without({
    modes: { [questionId]: true }
  }))
  .run(connection)
}

function clearAllSelectedSubmissions({
  connection,
  classroomActivityId,
  questionId,
}) {
  r.table('classroom_lesson_sessions')
  .get(classroomActivityId).replace(r.row.without({
    selected_submissions: { [questionId]: true }
  }))
  .run(connection)
}

function clearAllSubmissions({
  connection,
  classroomActivityId,
  questionId,
}) {
  r.table('classroom_lesson_sessions')
  .get(classroomActivityId).replace(r.row.without({
    submissions: { [questionId]: true }
  }))
  .run(connection)
}

function saveSelectedStudentSubmission({
  classroomActivityId,
  questionId,
  studentId,
  connection,
}) {
  r.table('classroom_lesson_sessions')
  .get(classroomActivityId)
  .update({
    selected_submissions: {
      [questionId]: {
        [studentId]: true
      }
    }
  })
  .run(connection)
}

function updateStudentSubmissionOrder({
  classroomActivityId,
  questionId,
  studentId,
  connection,
}) {
  r.table('classroom_lesson_sessions')
  .get(classroomActivityId)
  .hasFields({
    selected_submission_order: {
      [questionId]: true
    }
  })
  .run(connection)
  .then((result) => {
    if (result) {
      r.table('classroom_lesson_sessions')
      .get(classroomActivityId)('selected_submission_order')(questionId)
      .contains(studentId)
      .run(connection)
      .then((result) => {
        if (!result) {
          r.table('classroom_lesson_sessions')
          .get(classroomActivityId)
          .update({
            selected_submission_order: {
              [questionId]: r.row('selected_submission_order')(questionId)
                .append(studentId)
            }
          })
          .run(connection)
        } else {
          r.table('classroom_lesson_sessions')
          .get(classroomActivityId)
          .update({
            selected_submission_order: {
              [questionId]: r.row('selected_submission_order')(questionId)
                .filter((item) => item.ne(studentId))
            }
          })
          .run(connection)
        }
      })
    } else {
      r.table('classroom_lesson_sessions')
      .get(classroomActivityId)
      .update({
        selected_submission_order: {
          [questionId]: [studentId]
        }
      })
      .run(connection)
    }
  })
}

function removeSelectedStudentSubmission({
  classroomActivityId,
  questionId,
  studentId,
  connection,
}) {
  r.table('classroom_lesson_sessions')
  .get(classroomActivityId)
  .replace(r.row.without({
    selected_submissions: {
      [questionId]: {
        [studentId]: true
      }
    }
  }))
  .run(connection)
}

function setMode({
  classroomActivityId,
  questionId,
  mode,
  connection,
}) {
  r.table('classroom_lesson_sessions')
  .get(classroomActivityId)
  .update({
    modes: {
      [questionId]: mode
    }
  })
  .run(connection)
}

function subscribeToClassroomLesson({
  connection,
  client,
  classroomLessonUID
}) {
  r.table('classroom_lessons')
  .get(classroomLessonUID)
  .changes({ includeInitial: true })
  .run(connection, (err, cursor) => {
    cursor.each((err, document) => {
      let lesson = document.new_val;
      client.emit(`classroomLesson:${lesson.id}`, lesson)
    });
  });
}

function getAllClassroomLessons({
  connection,
  client,
}) {
  r.table('classroom_lessons')
  .run(connection, (err, cursor) => {
    r.table('classroom_lessons').count().run(connection, (err, val) => {
      const numberOfLessons = val
      let classroomLessons = {}
      let lessonCount = 0
      cursor.each(function(err, document) {
        if (err) throw err
        classroomLessons[document.id] = document
        lessonCount++
        if (lessonCount === numberOfLessons) {
          client.emit('classroomLessons', classroomLessons)
        }
      });
    })
  });
}

function createOrUpdateClassroomLesson({
  connection,
  classroomLesson,
  client
}) {
  r.table('classroom_lessons')
  .insert(classroomLesson, { conflict: 'update' })
  .run(connection, function(err, document) {
    if (err) throw err
    client.emit(`createdOrUpdatedClassroomLesson:${classroomLesson.id}`, true)
    getAllClassroomLessons({connection, client})
  })
}

function deleteClassroomLesson({
  connection,
  classroomLessonID
}) {
  r.table('classroom_lessons')
  .get(classroomLessonID)
  .delete()
  .run(connection)
}

function getAllClassroomLessonReviews({
  connection,
  client,
}) {
  r.table('reviews')
  .run(connection, (err, cursor) => {
    r.table('reviews').count().run(connection, (err, val) => {
      const numberOfReviews = val
      let reviews = {}
      let reviewCount = 0
      cursor.each(function(err, document) {
        if (err) throw err
        reviews[document.id] = document
        reviewCount++
        if (reviewCount === numberOfReviews) {
          client.emit('classroomLessonReviews', reviews)
        }
      });
    })
  });
}

function createOrUpdateReview({
  connection,
  review
}) {
  review.timestamp = new Date()
  r.table('reviews')
  .insert(review, { conflict: 'update' })
  .run(connection)
}

function getAllEditionMetadata({
  client,
  connection
}) {
  r.table('lesson_edition_metadata')
  .run(connection, (err, cursor) => {
    r.table('lesson_edition_metadata').count().run(connection, (err, val) => {
      const numberOfEditions = val
      let editions = {}
      let editionCount = 0
      cursor.each(function(err, document) {
        if (err) throw err
        editions[document.id] = document
        editionCount++
        if (editionCount === numberOfEditions) {
          client.emit('editionMetadata', editions)
        }
      });
    })

  })
}

function getAllEditionMetadataForLesson({
  client,
  connection,
  lessonID
}) {
  if (lessonID) {
    r.table('lesson_edition_metadata')
    .filter(r.row("lesson_id").eq(lessonID))
    .run(connection, (err, cursor) => {
      r.table('lesson_edition_metadata').filter(r.row("lesson_id").eq(lessonID)).count().run(connection, (err, val) => {
        const numberOfEditions = val
        let editions = {}
        let editionCount = 0
        cursor.each(function(err, document) {
          if (err) throw err
          editions[document.id] = document
          editionCount++
          if (editionCount === numberOfEditions) {
            client.emit(`editionMetadataForLesson:${lessonID}`, editions)
          }
        });
      })
    })
  }
}

function getEditionQuestions({
  editionID,
  connection,
  client
}) {
  r.table('lesson_edition_questions')
  .get(editionID)
  .changes({ includeInitial: true })
  .run(connection, (err, cursor) => {
    cursor.each((err, document) => {
      let edition = document.new_val;
      client.emit(`getEditionQuestionsForEdition:${edition.id}`, edition)
    });
  });
}

function updateEditionMetadata({
  connection,
  editionMetadata
}) {
  r.table('lesson_edition_metadata')
  .insert(editionMetadata, { conflict: 'update' })
  .run(connection)
}

r.connect({
  host: 'localhost',
  port: 28015,
  db: 'quill_lessons'
}).then((connection) => {
  io.on('connection', (client) => {
    currentConnections[client.id] = { socket: client, role: null };

    client.on('teacherConnected', (classroomActivityId) => {
      teacherConnected({
        connection,
        classroomActivityId,
        client,
      })
    });

    client.on('disconnect', () => {
      disconnect({
        connection,
        client,
      })
    });

    client.on('subscribeToClassroomLessonSession', (classroomLessonSessionId) => {
      subscribeToClassroomLessonSession({
        connection,
        client,
        classroomLessonSessionId,
      });
    });

    client.on('createPreviewSession', (previewSessionData) => {
      createPreviewSession({
        connection,
        previewSessionData,
      });
    });

    client.on('subscribeToCurrentSlide', (classroomActivityId) => {
      subscribeToCurrentSlide({
        connection,
        client,
        classroomActivityId
      });
    });

    client.on('updateClassroomLessonSession', (session) => {
      updateClassroomLessonSession({
        session,
        connection
      });
    });

    client.on('createOrUpdateClassroomLessonSession', (classroomActivityId) => {
      createOrUpdateClassroomLessonSession({
        connection,
        classroomActivityId,
        client
      });
    });

    client.on('setSlideStartTime', (classroomActivityId, questionId) => {
      setSlideStartTime({
        connection,
        classroomActivityId,
        questionId,
      });
    });

    client.on('registerPresence', (classroomActivityId, studentId) => {
      registerPresence({
        connection,
        client,
        classroomActivityId,
        studentId,
      })
    });

    client.on('addStudent', (classroomActivityId, studentName) => {
      addStudent({
        connection,
        client,
        classroomActivityId,
        studentName,
      });
    });

    client.on('saveStudentSubmission', (classroomActivityId, questionId, studentId, submission) => {
      saveStudentSubmission({
        classroomActivityId,
        connection,
        questionId,
        studentId,
        submission,
      });
    });

    client.on('removeStudentSubmission', (classroomActivityId, questionId, studentId) => {
      removeStudentSubmission({
        classroomActivityId,
        connection,
        questionId,
        studentId,
      });
    });

    client.on('removeMode', (classroomActivityId, questionId) => {
      removeMode({
        connection,
        classroomActivityId,
        questionId,
      });
    })

    client.on('clearAllSelectedSubmissions', (classroomActivityId, questionId) => {
      clearAllSelectedSubmissions({
        connection,
        classroomActivityId,
        questionId,
      });
    })

    client.on('clearAllSubmissions', (classroomActivityId, questionId) => {
      clearAllSubmissions({
        connection,
        classroomActivityId,
        questionId,
      });
    })

    client.on('saveSelectedStudentSubmission', (classroomActivityId, questionId, studentId) => {
      saveSelectedStudentSubmission({
        classroomActivityId,
        questionId,
        studentId,
        connection,
      });
    })

    client.on('updateStudentSubmissionOrder', (classroomActivityId, questionId, studentId) => {
      updateStudentSubmissionOrder({
        classroomActivityId,
        questionId,
        studentId,
        connection,
      });
    })

    client.on('removeSelectedStudentSubmission', (classroomActivityId, questionId, studentId) => {
      removeSelectedStudentSubmission({
        classroomActivityId,
        questionId,
        studentId,
        connection,
      });
    })

    client.on('setMode', (classroomActivityId, questionId, mode) => {
      setMode({
        classroomActivityId,
        questionId,
        mode,
        connection
      })
    })

    client.on('subscribeToClassroomLesson', (classroomLessonUID) => {
      subscribeToClassroomLesson({
        classroomLessonUID,
        connection,
        client
      })
    })

    client.on('getAllClassroomLessons', () => {
      getAllClassroomLessons({
        connection,
        client
      })
    })

    client.on('createOrUpdateClassroomLesson', (classroomLesson) => {
      createOrUpdateClassroomLesson({
        connection,
        classroomLesson,
        client
      })
    })

    client.on('deleteClassroomLesson', (classroomLessonID) => {
      deleteClassroomLesson({
        connection,
        classroomLessonID
      })
    })

    client.on('getAllClassroomLessonReviews', () => {
      getAllClassroomLessonReviews({
        connection,
        client
      })
    })

    client.on('createOrUpdateReview', (review) => {
      getAllClassroomLessonReviews({
        connection,
        review
      })
    })

    client.on('getAllEditionMetadata', () => {
      getAllEditionMetadata({
        connection,
        client
      })
    })

    client.on('getAllEditionMetadataForLesson', (lessonID) => {
      getAllEditionMetadataForLesson({
        connection,
        client,
        lessonID
      })
    })

    client.on('getEditionQuestions', (editionID) => {
      getEditionQuestions({
        connection,
        client,
        editionID
      })
    })

    client.on('updateEditionMetadata', (editionMetadata) => {
      updateEditionMetadata({
        connection,
        editionMetadata
      })
    })

  });
});

io.listen(8000);
console.log('listening on port ', 8000);
