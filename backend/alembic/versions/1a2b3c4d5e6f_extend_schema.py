"""rozszerzenie schematu - participants, checklist, expenses, nowe pola w events

Revision ID: 1a2b3c4d5e6f
Revises: 0335032cfc06
Create Date: 2026-04-26 09:00:00.000000

Migracja:
  - users: dodaje avatar_url
  - events: dodaje end_date, location_lat, location_lng, category, status, created_at
  - tworzy tabele: participants, checklist_items, expenses, expense_splits

UWAGI techniczne dla PostgreSQL:
  - Enum-y są osobnymi typami w bazie; tworzymy je jawnie raz na początku.
  - Używamy postgresql.ENUM zamiast sa.Enum, bo postgresql.ENUM(create_type=False)
    jest konsekwentnie respektowany przez SQLAlchemy zarówno w add_column,
    jak i w create_table (w przeciwieństwie do sa.Enum, gdzie event-handler
    before_create i tak próbuje utworzyć typ).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '1a2b3c4d5e6f'
down_revision: Union[str, None] = '0335032cfc06'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ─── Definicje enumów - postgresql.ENUM, nie sa.Enum! ──────────────────────
# Tworzymy raz na początku (z checkfirst=True) i potem podpinamy z create_type=False.
def _make_event_category(create_type: bool = False):
    return postgresql.ENUM(
        'TRIP', 'PARTY', 'MEETUP', 'WORK', 'SPORT', 'OTHER',
        name='eventcategory',
        create_type=create_type,
    )

def _make_event_status(create_type: bool = False):
    return postgresql.ENUM(
        'UPCOMING', 'ONGOING', 'PAST', 'CANCELLED',
        name='eventstatus',
        create_type=create_type,
    )

def _make_participant_role(create_type: bool = False):
    return postgresql.ENUM(
        'ORGANIZER', 'MEMBER',
        name='participantrole',
        create_type=create_type,
    )

def _make_rsvp_status(create_type: bool = False):
    return postgresql.ENUM(
        'ACCEPTED', 'DECLINED', 'PENDING',
        name='rsvpstatus',
        create_type=create_type,
    )


def upgrade() -> None:
    bind = op.get_bind()

    # ─── Krok 1: jawnie utwórz typy enum w PostgreSQL ─────────────────────
    # checkfirst=True - jeśli typ już istnieje, nie wybuchnie (idempotent)
    _make_event_category().create(bind, checkfirst=True)
    _make_event_status().create(bind, checkfirst=True)
    _make_participant_role().create(bind, checkfirst=True)
    _make_rsvp_status().create(bind, checkfirst=True)

    # ─── Users: dodaj avatar_url ─────────────────────────────────────────
    op.add_column(
        'users',
        sa.Column('avatar_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    )

    # ─── Events: nowe kolumny ────────────────────────────────────────────
    op.add_column('events', sa.Column('end_date', sa.DateTime(), nullable=True))
    op.add_column('events', sa.Column('location_lat', sa.Float(), nullable=True))
    op.add_column('events', sa.Column('location_lng', sa.Float(), nullable=True))
    op.add_column(
        'events',
        sa.Column(
            'category',
            _make_event_category(create_type=False),
            nullable=False,
            server_default='OTHER',
        ),
    )
    op.add_column(
        'events',
        sa.Column(
            'status',
            _make_event_status(create_type=False),
            nullable=False,
            server_default='UPCOMING',
        ),
    )
    op.add_column(
        'events',
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    # ─── Tabela participants ────────────────────────────────────────────
    op.create_table(
        'participants',
        sa.Column('id', sqlmodel.sql.sqltypes.GUID(), nullable=False),
        sa.Column('event_id', sqlmodel.sql.sqltypes.GUID(), nullable=False),
        sa.Column('user_id', sqlmodel.sql.sqltypes.GUID(), nullable=False),
        sa.Column('role', _make_participant_role(create_type=False), nullable=False),
        sa.Column('rsvp', _make_rsvp_status(create_type=False), nullable=False),
        sa.Column('joined_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('event_id', 'user_id', name='uq_participant_event_user'),
    )
    op.create_index('ix_participants_event_id', 'participants', ['event_id'])
    op.create_index('ix_participants_user_id', 'participants', ['user_id'])

    # ─── Tabela checklist_items ─────────────────────────────────────────
    op.create_table(
        'checklist_items',
        sa.Column('id', sqlmodel.sql.sqltypes.GUID(), nullable=False),
        sa.Column('event_id', sqlmodel.sql.sqltypes.GUID(), nullable=False),
        sa.Column('label', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('is_done', sa.Boolean(), nullable=False),
        sa.Column('created_by_id', sqlmodel.sql.sqltypes.GUID(), nullable=False),
        sa.Column('assigned_to_id', sqlmodel.sql.sqltypes.GUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['assigned_to_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_checklist_items_event_id', 'checklist_items', ['event_id'])

    # ─── Tabela expenses ────────────────────────────────────────────────
    op.create_table(
        'expenses',
        sa.Column('id', sqlmodel.sql.sqltypes.GUID(), nullable=False),
        sa.Column('event_id', sqlmodel.sql.sqltypes.GUID(), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sqlmodel.sql.sqltypes.AutoString(length=3), nullable=False),
        sa.Column('paid_by_id', sqlmodel.sql.sqltypes.GUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
        sa.ForeignKeyConstraint(['paid_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_expenses_event_id', 'expenses', ['event_id'])

    # ─── Tabela expense_splits ──────────────────────────────────────────
    op.create_table(
        'expense_splits',
        sa.Column('id', sqlmodel.sql.sqltypes.GUID(), nullable=False),
        sa.Column('expense_id', sqlmodel.sql.sqltypes.GUID(), nullable=False),
        sa.Column('user_id', sqlmodel.sql.sqltypes.GUID(), nullable=False),
        sa.ForeignKeyConstraint(['expense_id'], ['expenses.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_expense_splits_expense_id', 'expense_splits', ['expense_id'])
    op.create_index('ix_expense_splits_user_id', 'expense_splits', ['user_id'])

    # ─── Backfill: dodaj istniejących ownerów jako Participant z rolą ORGANIZER ──
    # Wszystkie eventy istnieją bez wpisu w participants - musimy je dorobić,
    # bo nowa logika autoryzacji opiera się na tej tabeli.
    op.execute("""
        INSERT INTO participants (id, event_id, user_id, role, rsvp, joined_at)
        SELECT
            gen_random_uuid(),
            e.id,
            e.owner_id,
            'ORGANIZER',
            'ACCEPTED',
            COALESCE(e.created_at, NOW())
        FROM events e
        WHERE NOT EXISTS (
            SELECT 1 FROM participants p
            WHERE p.event_id = e.id AND p.user_id = e.owner_id
        )
    """)


def downgrade() -> None:
    bind = op.get_bind()

    # Odwracamy w odwrotnej kolejności (najpierw zależne, potem podstawowe)
    op.drop_index('ix_expense_splits_user_id', table_name='expense_splits')
    op.drop_index('ix_expense_splits_expense_id', table_name='expense_splits')
    op.drop_table('expense_splits')

    op.drop_index('ix_expenses_event_id', table_name='expenses')
    op.drop_table('expenses')

    op.drop_index('ix_checklist_items_event_id', table_name='checklist_items')
    op.drop_table('checklist_items')

    op.drop_index('ix_participants_user_id', table_name='participants')
    op.drop_index('ix_participants_event_id', table_name='participants')
    op.drop_table('participants')

    op.drop_column('events', 'created_at')
    op.drop_column('events', 'status')
    op.drop_column('events', 'category')
    op.drop_column('events', 'location_lng')
    op.drop_column('events', 'location_lat')
    op.drop_column('events', 'end_date')

    op.drop_column('users', 'avatar_url')

    # Drop enumów dopiero po usunięciu wszystkich kolumn, które ich używały
    _make_rsvp_status().drop(bind, checkfirst=True)
    _make_participant_role().drop(bind, checkfirst=True)
    _make_event_status().drop(bind, checkfirst=True)
    _make_event_category().drop(bind, checkfirst=True)
