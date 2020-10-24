import React from 'react'
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AcmLabels } from './AcmLabels'

describe('AcmLabels', () => {
    test('renders', () => {
        const { getByText } = render(<AcmLabels labels={['foo=bar', 'cluster=management']} />)
        expect(getByText('foo=bar')).toBeInTheDocument()
        expect(getByText('cluster=management')).toBeInstanceOf(HTMLSpanElement)
    })
    test('returns null when no labels are provided', () => {
        const { container } = render(<AcmLabels labels={[]} />)
        expect(container.querySelector('.pf-c-label')).toBeNull()
    })
    test('has zero accessibility defects', async () => {
        const { container } = render(<AcmLabels labels={['foo=bar', 'cluster=management']} />)
        expect(await axe(container)).toHaveNoViolations()
    })
})
