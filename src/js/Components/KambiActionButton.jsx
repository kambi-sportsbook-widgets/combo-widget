import React from 'react'
import PropTypes from 'prop-types'
import styles from './KambiActionButton.scss'

const KambiActionButton = ({ label, onClick }) => (
  <div className={`KambiWidget-action ${styles.button}`} onClick={onClick}>
    {label}
  </div>
)

KambiActionButton.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
}

export default KambiActionButton
