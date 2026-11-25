/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

/**
 * Implements controlled descriptive choice cards.
 */

"use client";

import { useId, type ReactNode } from "react";
import { Icon, type IconName } from "@miaixz/icons";

/**
 * Describes one card and its selection and availability.
 * @public
 */
export interface ChoiceCard {
  readonly id: string;
  readonly title: string;
  readonly icon: IconName;
  readonly description?: ReactNode;
  readonly selected: boolean;
  readonly onSelect?: (() => void) | undefined;
  readonly unavailable?: boolean;
  readonly availability?: string | undefined;
}

/**
 * Properties for the controlled card choice group.
 * @public
 */
export interface ChoiceCardsProps {
  readonly cards: readonly ChoiceCard[];
  readonly label?: string;
  readonly disabled?: boolean;
}

/**
 * Presents a single selection as descriptive cards with a shared selected state.
 * @param props Card identities, content, availability and interaction state.
 * @returns Responsive, keyboard-operable choice cards.
 * @public
 */
export function ChoiceCards({ cards, label, disabled = false }: ChoiceCardsProps) {
  const id = useId();
  return (
    <div className="miaixz-choice-cards" role={label ? "group" : undefined} aria-label={label}>
      {cards.map((card, index) => (
        <button
          key={card.id}
          type="button"
          className="miaixz-choice-card"
          aria-pressed={card.selected}
          aria-labelledby={`${id}-${index}-title`}
          aria-describedby={card.description ? `${id}-${index}-description` : undefined}
          data-unavailable={card.unavailable || undefined}
          disabled={disabled || !card.onSelect}
          onClick={card.onSelect}
        >
          <span className="miaixz-choice-card-icon" aria-hidden="true">
            <Icon name={card.icon} size="display" />
          </span>
          <strong id={`${id}-${index}-title`}>{card.title}</strong>
          <span id={`${id}-${index}-description`} className="miaixz-choice-card-description">
            {card.description}
          </span>
          {card.unavailable && card.availability && (
            <span className="miaixz-choice-card-availability">{card.availability}</span>
          )}
        </button>
      ))}
    </div>
  );
}
