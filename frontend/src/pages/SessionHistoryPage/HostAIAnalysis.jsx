import { useState } from 'react'
import {
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { hostAIAnalysisApi } from '../../services/hostAIAnalysisApi'
import { sessionHistoryApi } from '../../services/sessionHistoryApi'
import './HostAIAnalysis.css'


function QuestionInsights({ title, icon: Icon, items, className }) {
  if (!items?.length) return null

  return (
    <section className={`ai-insight-section ${className || ''}`}>
      <h4><Icon size={17} /> {title}</h4>
      <div className="ai-question-insights">
        {items.map((item) => (
          <div key={`${title}-${item.question_index}`}>
            <strong>Question {item.question_index + 1}</strong>
            <p>{item.reason || item.note}</p>
          </div>
        ))}
      </div>
    </section>
  )
}


function TopicList({ title, items, icon: Icon }) {
  return (
    <section className="ai-topic-group">
      <h4><Icon size={17} /> {title}</h4>
      {items?.length ? (
        <ul>
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p>No clear topic pattern identified.</p>
      )}
    </section>
  )
}


function HostAIAnalysisHost({ sessionId, submittedCount }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generateAnalysis() {
    setLoading(true)
    setError('')

    try {
      setAnalysis(await hostAIAnalysisApi.get(sessionId))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!analysis) {
    return (
      <section className="simple-card ai-analysis-prompt">
        <div>
          <p className="eyebrow">V3.4 · Host intelligence</p>
          <h2><BrainCircuit size={22} /> AI performance analysis</h2>
          <p>
            Turn aggregate answers into teaching insights. Participant names are
            never sent to Gemini.
          </p>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={generateAnalysis}
          disabled={!submittedCount || loading}
        >
          {loading ? <Loader2 className="spin" size={17} /> : <Sparkles size={17} />}
          {loading ? 'Analyzing performance...' : 'Generate AI analysis'}
        </button>
        {!submittedCount && (
          <p className="ai-analysis-hint">At least one participant must submit before analysis.</p>
        )}
        {error && <p className="status error">{error}</p>}
      </section>
    )
  }

  return (
    <section className="simple-card ai-analysis-panel">
      <div className="ai-analysis-heading">
        <div>
          <p className="eyebrow">AI performance analysis</p>
          <h2><BrainCircuit size={22} /> {analysis.performance_level}</h2>
        </div>
        <button
          className="icon-text-button"
          type="button"
          onClick={generateAnalysis}
          disabled={loading}
        >
          {loading ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
          Regenerate
        </button>
      </div>

      {error && <p className="status error">{error}</p>}
      <p className="ai-overall-summary">{analysis.overall_summary}</p>

      <div className="ai-analysis-metrics">
        <span><strong>{analysis.participant_count}</strong> Participants</span>
        <span><strong>{analysis.submitted_count}</strong> Submitted</span>
        <span>
          <strong>{analysis.average_score}/{analysis.total_questions}</strong>
          Average score
        </span>
      </div>

      <div className="ai-topic-grid">
        <TopicList title="Strong topics" items={analysis.strong_topics} icon={TrendingUp} />
        <TopicList title="Weak topics" items={analysis.weak_topics} icon={TrendingDown} />
      </div>

      <div className="ai-insight-grid">
        <QuestionInsights
          title="Hardest questions"
          icon={TrendingDown}
          items={analysis.hardest_questions}
          className="hard"
        />
        <QuestionInsights
          title="Easiest questions"
          icon={CheckCircle2}
          items={analysis.easiest_questions}
          className="easy"
        />
      </div>

      <QuestionInsights
        title="Question quality notes"
        icon={BarChart3}
        items={analysis.question_quality_notes}
      />

      <section className="ai-question-evidence">
        <h4><BarChart3 size={17} /> Backend-calculated question performance</h4>
        <div>
          {analysis.question_stats.map((question) => (
            <article key={question.question_index}>
              <span>Q{question.question_index + 1}</span>
              <div>
                <strong>{question.question}</strong>
                <small>
                  {question.correct_count} correct · {question.wrong_count} wrong ·{' '}
                  {question.unanswered_count} unanswered
                </small>
              </div>
              <b>{question.correct_percentage}%</b>
            </article>
          ))}
        </div>
      </section>

      <section className="ai-actions">
        <h4><Lightbulb size={17} /> Recommended actions</h4>
        <ol>
          {analysis.recommended_actions.map((action) => <li key={action}>{action}</li>)}
        </ol>
      </section>
    </section>
  )
}


function ParticipantAIAnalysisPanel({ analysis, loading, error, onRegenerate }) {
  return (
    <section className="simple-card ai-analysis-panel">
      <div className="ai-analysis-heading">
        <div>
          <p className="eyebrow">AI personal review</p>
          <h2><BrainCircuit size={22} /> {analysis.performance_level}</h2>
        </div>
        <button
          className="icon-text-button"
          type="button"
          onClick={onRegenerate}
          disabled={loading}
        >
          {loading ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
          Regenerate
        </button>
      </div>

      {error && <p className="status error">{error}</p>}
      <p className="ai-overall-summary">{analysis.overall_summary}</p>

      <div className="ai-analysis-metrics">
        <span><strong>{analysis.score}/{analysis.total_questions}</strong> Your score</span>
        <span><strong>{analysis.correct_count}</strong> Correct</span>
        <span><strong>{analysis.incorrect_count}</strong> Incorrect</span>
        <span><strong>{analysis.class_average_score}/{analysis.total_questions}</strong> Class average</span>
      </div>

      <div className="ai-topic-grid">
        <TopicList title="Strong areas" items={analysis.strong_areas} icon={TrendingUp} />
        <TopicList title="Weak areas" items={analysis.weak_areas} icon={TrendingDown} />
      </div>

      <div className="ai-topic-grid">
        <TopicList title="What to learn next" items={analysis.what_to_learn_next} icon={Lightbulb} />
        <TopicList title="Likely misconceptions" items={analysis.likely_misconceptions} icon={BrainCircuit} />
      </div>

      {!!analysis.question_reviews?.length && (
        <section className="ai-question-evidence">
          <h4><BarChart3 size={17} /> Personal question review</h4>
          <div>
            {analysis.question_reviews.map((review) => (
              <article key={review.question_index}>
                <span>Q{review.question_index + 1}</span>
                <div>
                  <strong>{review.outcome}</strong>
                  <small>{review.review}</small>
                  <small>{review.next_step}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="ai-question-evidence">
        <h4><BarChart3 size={17} /> Your submitted answers</h4>
        <div>
          {analysis.answer_evidence.map((answer) => (
            <article key={answer.question_index}>
              <span>Q{answer.question_index + 1}</span>
              <div>
                <strong>{answer.question}</strong>
                <small>Selected: {answer.selected_answer}</small>
                {!answer.is_correct && <small>Correct: {answer.correct_answer}</small>}
              </div>
              <b>{answer.is_correct ? 'Correct' : 'Review'}</b>
            </article>
          ))}
        </div>
      </section>

      <section className="ai-actions">
        <h4><Lightbulb size={17} /> Practice recommendations</h4>
        <ol>
          {analysis.practice_recommendations.map((action) => <li key={action}>{action}</li>)}
        </ol>
      </section>
    </section>
  )
}


function HostAIAnalysisJoined({ sessionCode, hasSubmitted }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generateAnalysis() {
    setLoading(true)
    setError('')

    try {
      setAnalysis(await sessionHistoryApi.joinedAIAnalysis(sessionCode))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!analysis) {
    return (
      <section className="simple-card ai-analysis-prompt">
        <div>
          <p className="eyebrow">V3.4 - Personal coach</p>
          <h2><BrainCircuit size={22} /> AI personal review</h2>
          <p>
            Find your weak areas, what to study next, and a question-by-question review.
          </p>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={generateAnalysis}
          disabled={!hasSubmitted || loading}
        >
          {loading ? <Loader2 className="spin" size={17} /> : <Sparkles size={17} />}
          {loading ? 'Analyzing performance...' : 'Generate AI analysis'}
        </button>
        {!hasSubmitted && (
          <p className="ai-analysis-hint">Submit your quiz before generating a personal review.</p>
        )}
        {error && <p className="status error">{error}</p>}
      </section>
    )
  }

  return (
    <ParticipantAIAnalysisPanel
      analysis={analysis}
      loading={loading}
      error={error}
      onRegenerate={generateAnalysis}
    />
  )
}


function HostAIAnalysis({
  mode = 'hosted',
  sessionId,
  sessionCode,
  submittedCount,
  hasSubmitted = true,
}) {
  if (mode === 'joined') {
    return (
      <HostAIAnalysisJoined
        sessionCode={sessionCode}
        hasSubmitted={hasSubmitted}
      />
    )
  }

  return (
    <HostAIAnalysisHost
      sessionId={sessionId}
      submittedCount={submittedCount}
    />
  )
}

export default HostAIAnalysis
